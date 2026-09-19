"use client";

import "./Profile.css";
import {
    useEditorStore,
} from "@/stores/editor.store";
import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import {
        useLocation,

    useNavigate,
} from "react-router-dom";
import {
    supabase,
} from "@/lib/supabase";


type AuthMode =
    | "login"
    | "register"
    | "register-otp"
    | "forgot-otp"
    | "forgot-password"
    | "profile"
    | "change-otp"
    | "change-password";

export default function Profile() {
const navigate = useNavigate();
const location = useLocation();
const returnWorkspace =
    location.state?.returnWorkspace;
const setWorkspace = useEditorStore(
    state => state.setWorkspace
);
function returnToPreviousPage() {

    if (returnWorkspace) {

        setWorkspace(returnWorkspace);

        navigate(-1);

        return;
    }

    navigate("/", {
        replace: true,
    });
}
function handleBack() {

    const returnWorkspace =
        location.state?.returnWorkspace;

    // Profile được mở từ một workspace trong Editor
    if (returnWorkspace) {

        setWorkspace(returnWorkspace);

        navigate(-1);

        return;
    }

    // Profile được mở từ Home
    navigate("/", {
        replace: true,
    });
}

    // =========================================================
    // AUTH
    // =========================================================

    const [mode, setMode] =
        useState<AuthMode>("login");


    const [email, setEmail] =
        useState("");
const [displayName, setDisplayName] =
    useState("");

    const [password, setPassword] =
        useState("");


    const [confirmPassword, setConfirmPassword] =
        useState("");


    const [otp, setOtp] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [message, setMessage] =
        useState("");


    // =========================================================
    // OTP TIMER
    // =========================================================

    const [otpExpiresAt, setOtpExpiresAt] =
        useState<number | null>(null);


    const [remainingSeconds, setRemainingSeconds] =
        useState(0);


    useEffect(() => {

        if (!otpExpiresAt) {
            setRemainingSeconds(0);
            return;
        }


        const timer =
            window.setInterval(() => {

                const remaining =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                otpExpiresAt -
                                Date.now()
                            ) / 1000
                        )
                    );


                setRemainingSeconds(
                    remaining
                );


                if (remaining <= 0) {

                    window.clearInterval(
                        timer
                    );

                }

            }, 1000);


        return () => {

            window.clearInterval(
                timer
            );

        };

    }, [otpExpiresAt]);


    // =========================================================
    // INITIAL AUTH CHECK
    // =========================================================

    useEffect(() => {

        async function loadSession() {

            const {
                data,
            } =
                await supabase.auth.getSession();


            if (data.session?.user) {

                setEmail(
                    data.session.user.email ?? ""
                );

                setMode("profile");

            }

            else {

                setMode("login");

            }

        }


        loadSession();


        const {
            data: listener,
        } =
            supabase.auth.onAuthStateChange(
                (
                    event,
                    session
                ) => {

                    if (
                        session?.user
                    ) {

                        setEmail(
                            session.user.email ?? ""
                        );



                    }

                    else {

                        setMode(
                            "login"
                        );

                    }

                }
            );


        return () => {

            listener.subscription.unsubscribe();

        };

    }, []);


    // =========================================================
    // CLEAR
    // =========================================================

    function clearMessages() {

        setError("");

        setMessage("");

    }


    // =========================================================
    // LOGIN
    // =========================================================

    async function handleLogin(
        e: FormEvent
    ) {

        e.preventDefault();

        clearMessages();


        const cleanEmail =
            email.trim();


        if (!cleanEmail) {

            setError(
                "Vui lòng nhập email."
            );

            return;

        }


        if (!password) {

            setError(
                "Vui lòng nhập mật khẩu."
            );

            return;

        }


        setLoading(true);


        try {

            const {
                error,
            } =
                await supabase.auth.signInWithPassword({

                    email:
                        cleanEmail,

                    password,

                });


            if (error) {

                throw error;

            }

setPassword("");

if (returnWorkspace) {
    setWorkspace(returnWorkspace);
    navigate(-1);
    return;
}

navigate("/", {
    replace: true,
});

        }

        catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Đăng nhập thất bại."
            );

        }

        finally {

            setLoading(false);

        }

    }


    // =========================================================
    // REGISTER
    // =========================================================

    async function handleRegister(
        e: FormEvent
    ) {

        e.preventDefault();

        clearMessages();


        const cleanEmail =
            email.trim();
const cleanDisplayName =
    displayName.trim();
    if (!cleanDisplayName) {

    setError(
        "Vui lòng nhập tên."
    );

    return;

}

        if (!cleanEmail) {

            setError(
                "Vui lòng nhập email."
            );

            return;

        }


        if (
            password.length < 6
        ) {

            setError(
                "Mật khẩu phải có ít nhất 6 ký tự."
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            setError(
                "Mật khẩu xác nhận không khớp."
            );

            return;

        }


        setLoading(true);


        try {

        const {
    data,
    error,
} =
    await supabase.auth.signUp({

        email:
            cleanEmail,

        password,

        options: {

            data: {

                display_name:
                    cleanDisplayName,

            },

        },

    });


            if (error) {

                throw error;

            }


            console.log(
                "[REGISTER]",
                data
            );


            setPassword("");

            setConfirmPassword("");


            /*
             * Email confirmation OFF:
             * Supabase tạo session ngay.
             */

if (data.session) {

    setPassword("");
    setConfirmPassword("");

    if (returnWorkspace) {
        setWorkspace(returnWorkspace);
        navigate(-1);
        return;
    }

    navigate("/", {
        replace: true,
    });

    return;
}


            /*
             * Email confirmation ON:
             */

     console.log(
    "[REGISTER]",
    data
);

setOtp("");

setOtpExpiresAt(
    Date.now() + 5 * 60 * 1000
);

setMode("register-otp");

setMessage(
    `Mã OTP đã được gửi tới ${cleanEmail}.`
);

        }

        catch (err) {

            console.error(
                "REGISTER ERROR:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Đăng ký thất bại."
            );

        }

        finally {

            setLoading(false);

        }

    }

// =========================================================
// VERIFY REGISTER OTP
// =========================================================

async function handleVerifyRegisterOtp() {

    clearMessages();

    const cleanOtp = otp.trim();
    const cleanEmail = email.trim();

    if (!cleanOtp) {
        setError("Vui lòng nhập mã OTP.");
        return;
    }

    if (cleanOtp.length !== 8) {
        setError("Mã OTP phải có 8 số.");
        return;
    }

    if (remainingSeconds <= 0) {
        setError(
            "OTP đã hết hạn. Vui lòng gửi lại mã mới."
        );
        return;
    }

    setLoading(true);

    try {

        // =====================================================
        // 1. VERIFY OTP
        // =====================================================

        const {
            data,
            error,
        } = await supabase.auth.verifyOtp({

            email: cleanEmail,

            token: cleanOtp,

            type: "email",

        });

        if (error) {
            throw error;
        }

        console.log(
            "[REGISTER OTP VERIFIED]",
            data
        );


        // =====================================================
        // 2. LẤY USER VỪA XÁC THỰC
        // =====================================================

        const {
            data: userData,
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        const user = userData.user;

        if (!user) {
            throw new Error(
                "Không tìm thấy tài khoản sau khi xác thực OTP."
            );
        }


        // =====================================================
        // 3. TẠO PROFILE
        // =====================================================

   const {
    error: profileError,
} = await supabase
    .from("profiles")
    .insert({

        id: user.id,

        email:
            user.email,

        display_name:
            displayName.trim(),

        is_active:
            true,

    });

        if (profileError) {
            throw profileError;
        }


        console.log(
            "[PROFILE CREATED]",
            user.id
        );


        // =====================================================
        // 4. RESET STATE
        // =====================================================

        setOtp("");

        setOtpExpiresAt(null);

        setPassword("");

        setConfirmPassword("");

setDisplayName("");
        // =====================================================
        // 5. QUAY VỀ
        // =====================================================

        if (returnWorkspace) {

            setWorkspace(returnWorkspace);

            navigate(-1);

            return;
        }

        navigate("/", {
            replace: true,
        });


    } catch (err) {

        console.error(
            "VERIFY REGISTER OTP ERROR:",
            err
        );

        setError(
            err instanceof Error
                ? err.message
                : "OTP không hợp lệ hoặc không thể tạo tài khoản."
        );

    } finally {

        setLoading(false);

    }
}

async function handleResendRegisterOtp() {

    clearMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
        setError("Không tìm thấy email đăng ký.");
        return;
    }

    if (loading) {
        return;
    }

    setLoading(true);

    try {

        console.log("[REGISTER OTP RESEND] Requesting:", cleanEmail);

        const {
            data,
            error,
        } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
        });

        console.log(
            "[REGISTER OTP RESEND] Response:",
            {
                data,
                error,
            }
        );

        if (error) {
            throw error;
        }

        // Xóa mã cũ khỏi ô nhập
        setOtp("");

        // Reset timer UI
        setOtpExpiresAt(
            Date.now() + 5 * 60 * 1000
        );

        setMessage(
            `Đã gửi mã OTP mới tới ${cleanEmail}. Hãy kiểm tra email mới nhất.`
        );

    } catch (err) {

        console.error(
            "[REGISTER OTP RESEND ERROR]",
            err
        );

        setError(
            err instanceof Error
                ? err.message
                : "Không thể gửi lại OTP."
        );

    } finally {

        setLoading(false);

    }
}
    // =========================================================
    // SEND FORGOT OTP
    // =========================================================
async function handleForgotOtp() {

    clearMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
        setError("Vui lòng nhập email.");
        return;
    }

    setLoading(true);

    try {

        const {
            error,
        } = await supabase.auth.resetPasswordForEmail(
            cleanEmail
        );

        if (error) {
            throw error;
        }

        setOtp("");

        setOtpExpiresAt(
            Date.now() + 5 * 60 * 1000
        );

        setMode("forgot-otp");

        setMessage(
            `Mã OTP đã được gửi tới ${cleanEmail}.`
        );

    } catch (err) {

        console.error(
            "FORGOT OTP ERROR:",
            err
        );

        setError(
            err instanceof Error
                ? err.message
                : "Không thể gửi OTP."
        );

    } finally {

        setLoading(false);

    }

}

    // =========================================================
    // VERIFY FORGOT OTP
    // =========================================================

async function handleVerifyForgotOtp() {
    clearMessages();

    const cleanOtp = otp.trim();

    if (!cleanOtp) {
        setError("Vui lòng nhập mã OTP.");
        return;
    }

    if (cleanOtp.length !== 8) {
        setError("Mã OTP phải có 8 số.");
        return;
    }

    if (remainingSeconds <= 0) {
        setError(
            "OTP đã hết hạn. Vui lòng gửi lại mã mới."
        );
        return;
    }

    setLoading(true);

    try {
        const {
            data,
            error,
        } = await supabase.auth.verifyOtp({
            email,
            token: cleanOtp,
            type: "recovery",
        });

        if (error) {
            throw error;
        }

        console.log(
            "[RECOVERY OTP VERIFIED]",
            data
        );

        setOtpExpiresAt(null);
        setOtp("");

        setMode("forgot-password");

        setMessage(
            "Xác nhận OTP thành công. Hãy tạo mật khẩu mới."
        );

    } catch (err) {
        console.error(
            "VERIFY FORGOT OTP ERROR:",
            err
        );

        setError(
            err instanceof Error
                ? err.message
                : "OTP không hợp lệ hoặc đã hết hạn."
        );

    } finally {
        setLoading(false);
    }
}

    // =========================================================
    // RESET PASSWORD
    // =========================================================
async function handleResetPassword() {
    clearMessages();

    if (password.length < 6) {
        setError(
            "Mật khẩu phải có ít nhất 6 ký tự."
        );
        return;
    }

    if (password !== confirmPassword) {
        setError(
            "Mật khẩu xác nhận không khớp."
        );
        return;
    }

    setLoading(true);

    try {
        const { error } =
            await supabase.auth.updateUser({
                password,
            });

        if (error) {
            throw error;
        }

        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpExpiresAt(null);

        setMode("login");

        setMessage(
            "Đổi mật khẩu thành công. Bạn có thể đăng nhập."
        );

    } catch (err) {
        console.error(
            "RESET PASSWORD ERROR:",
            err
        );

        setError(
            err instanceof Error
                ? err.message
                : "Không thể đổi mật khẩu."
        );

    } finally {
        setLoading(false);
    }
}

    // =========================================================
    // CHANGE PASSWORD OTP
    // =========================================================

    async function handleChangePasswordOtp() {

        clearMessages();


        if (!email) {

            setError(
                "Không tìm thấy email tài khoản."
            );

            return;

        }


        setLoading(true);


        try {

            const {
                error,
            } =
                await supabase.auth.signInWithOtp({

                    email,

                    options: {

                        shouldCreateUser:
                            false,

                    },

                });


            if (error) {

                throw error;

            }


            setOtp("");

            setOtpExpiresAt(
                Date.now() +
                5 * 60 * 1000
            );


            setMode(
                "change-otp"
            );


            setMessage(
                `OTP đã được gửi tới ${email}.`
            );

        }

        catch (err) {

            console.error(
                "CHANGE PASSWORD OTP ERROR:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể gửi OTP."
            );

        }

        finally {

            setLoading(false);

        }

    }


    // =========================================================
    // VERIFY CHANGE PASSWORD OTP
    // =========================================================

    async function handleVerifyChangeOtp() {

        clearMessages();


        if (!otp.trim()) {

            setError(
                "Vui lòng nhập mã OTP."
            );

            return;

        }


        if (
            remainingSeconds <= 0
        ) {

            setError(
                "OTP đã hết hạn. Vui lòng gửi lại mã mới."
            );

            return;

        }


        setLoading(true);


        try {

            const {
                error,
            } =
                await supabase.auth.verifyOtp({

                    email,

                    token:
                        otp.trim(),

                    type:
                        "email",

                });


            if (error) {

                throw error;

            }


            setMode(
                "change-password"
            );


            setMessage(
                "Xác nhận OTP thành công."
            );

        }

        catch (err) {

            console.error(
                "VERIFY CHANGE OTP ERROR:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "OTP không hợp lệ."
            );

        }

        finally {

            setLoading(false);

        }

    }


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    async function handleChangePassword() {

        clearMessages();


        if (
            password.length < 6
        ) {

            setError(
                "Mật khẩu phải có ít nhất 6 ký tự."
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            setError(
                "Mật khẩu xác nhận không khớp."
            );

            return;

        }


        setLoading(true);


        try {

            const {
                error,
            } =
                await supabase.auth.updateUser({

                    password,

                });


            if (error) {

                throw error;

            }


            setPassword("");

            setConfirmPassword("");

            setOtp("");

            setOtpExpiresAt(null);


            setMode("profile");


            setMessage(
                "Đổi mật khẩu thành công."
            );

        }

        catch (err) {

            console.error(
                "CHANGE PASSWORD ERROR:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể đổi mật khẩu."
            );

        }

        finally {

            setLoading(false);

        }

    }


    // =========================================================
    // SIGN OUT
    // =========================================================

    async function handleSignOut() {

        await supabase.auth.signOut();

        setPassword("");

        setConfirmPassword("");

        setOtp("");

        setMessage("");

        setError("");

        setMode("login");

    }


    // =========================================================
    // BACK
    // =========================================================

    function goLogin() {

        clearMessages();

        setPassword("");

        setConfirmPassword("");

        setOtp("");

        setOtpExpiresAt(null);

        setMode("login");

    }


    // =========================================================
    // BACK TO PROFILE
    // =========================================================

    function goProfile() {

        clearMessages();

        setPassword("");

        setConfirmPassword("");

        setOtp("");

        setOtpExpiresAt(null);

        setMode("profile");

    }


    // =========================================================
    // OTP TIMER TEXT
    // =========================================================

    function formatOtpTime() {

        const minutes =
            Math.floor(
                remainingSeconds / 60
            );


        const seconds =
            remainingSeconds % 60;


        return `${minutes}:${String(
            seconds
        ).padStart(2, "0")}`;

    }


    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="profile-page">

            <div className="profile-card">

                {/* =================================================
                    LOGIN
                ================================================= */}

                {mode === "login" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                🔐
                            </div>

                            <div>

                                <h2>
                                    Đăng nhập
                                </h2>

                                <p>
                                    Đăng nhập SubKaraokeAI
                                </p>

                            </div>

                        </div>


                        <form
                            className="profile-content"
                            onSubmit={
                                handleLogin
                            }
                        >

                            <div className="profile-field">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={e =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Mật khẩu
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={e =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Mật khẩu"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                            </div>


                            <button
                                type="submit"
                                className="profile-primary-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang đăng nhập..."
                                    : "Đăng nhập"}
                            </button>


                            <button
                                type="button"
                                className="profile-link-btn"
                                onClick={() => {

                                    clearMessages();

                                    setMode(
                                        "register"
                                    );

                                }}
                                disabled={loading}
                            >
                                Chưa có tài khoản? Đăng ký
                            </button>


                            <button
                                type="button"
                                className="profile-link-btn"
                                onClick={() => {

                                    clearMessages();

                                    setMode(
                                        "forgot-otp"
                                    );

                                }}
                                disabled={loading}
                            >
                                Quên mật khẩu?
                            </button>


                         <button
    type="button"
    className="profile-back-btn"
    onClick={handleBack}
>
    ← Quay lại
</button>

                        </form>

                    </>

                )}


                {/* =================================================
                    REGISTER
                ================================================= */}

                {mode === "register" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                👤
                            </div>

                            <div>

                                <h2>
                                    Tạo tài khoản
                                </h2>

                                <p>
                                    Đăng ký SubKaraokeAI
                                </p>

                            </div>

                        </div>


                        <form
                            className="profile-content"
                            onSubmit={
                                handleRegister
                            }
                        >
<div className="profile-field">

    <label>
        Tên hiển thị
    </label>

    <input
        type="text"
        value={displayName}
        onChange={e =>
            setDisplayName(
                e.target.value
            )
        }
        placeholder="Nhập tên của bạn"
        autoComplete="name"
        disabled={loading}
    />

</div>
                            <div className="profile-field">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={e =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Mật khẩu
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={e =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ít nhất 6 ký tự"
                                    autoComplete="new-password"
                                    disabled={loading}
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Xác nhận mật khẩu
                                </label>

                                <input
                                    type="password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={e =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập lại mật khẩu"
                                    autoComplete="new-password"
                                    disabled={loading}
                                />

                            </div>


                            <button
                                type="submit"
                                className="profile-primary-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang tạo tài khoản..."
                                    : "Đăng ký"}
                            </button>


                            <button
                                type="button"
                                className="profile-link-btn"
                                onClick={
                                    goLogin
                                }
                                disabled={loading}
                            >
                                ← Đã có tài khoản? Đăng nhập
                            </button>

                        </form>

                    </>

                )}

{/* =================================================
    REGISTER OTP
================================================= */}

{mode === "register-otp" && (

    <>

        <div className="profile-header">

            <div className="profile-avatar">
                📧
            </div>

            <div>

                <h2>
                    Xác nhận email
                </h2>

                <p>
                    Nhập mã OTP để hoàn tất đăng ký
                </p>

            </div>

        </div>


        <div className="profile-content">

            <div className="profile-info">

                <span>
                    Mã OTP đã được gửi tới
                </span>

                <b>
                    {email}
                </b>

            </div>


            <div className="profile-field">

                <label>
                    Mã OTP
                </label>

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otp}
                    onChange={e =>
                        setOtp(
                            e.target.value
                                .replace(
                                    /\D/g,
                                    ""
                                )
                        )
                    }
                    placeholder="Nhập mã 8 số"
                    autoFocus
                    disabled={
                        loading ||
                        remainingSeconds <= 0
                    }
                />

            </div>


            <div className="profile-otp-timer">

                {remainingSeconds > 0

                    ? `OTP còn ${formatOtpTime()}`

                    : "OTP đã hết hạn"}

            </div>


            <button
                type="button"
                className="profile-primary-btn"
                onClick={
                    handleVerifyRegisterOtp
                }
                disabled={
                    loading ||
                    remainingSeconds <= 0
                }
            >

                {loading
                    ? "Đang xác nhận..."
                    : "Xác nhận OTP"}

            </button>


        <button
    type="button"
    className="profile-secondary-btn"
    onClick={handleResendRegisterOtp}
    disabled={loading}
>
    {loading
        ? "Đang gửi..."
        : "Gửi lại OTP"}
</button>

            <button
                type="button"
                className="profile-back-btn"
                onClick={() => {

                    clearMessages();

                    setOtp("");

                    setOtpExpiresAt(null);

                    setMode("register");

                }}
                disabled={loading}
            >
                ← Quay lại đăng ký
            </button>

        </div>

    </>

)}
                {/* =================================================
                    FORGOT OTP
                ================================================= */}

                {mode === "forgot-otp" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                📧
                            </div>

                            <div>

                                <h2>
                                    Quên mật khẩu
                                </h2>

                                <p>
                                    Nhận mã OTP qua email
                                </p>

                            </div>

                        </div>


                        <div className="profile-content">

                            <div className="profile-field">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={e =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="you@example.com"
                                    disabled={loading}
                                />

                            </div>


                            {!otpExpiresAt && (

                                <button
                                    type="button"
                                    className="profile-primary-btn"
                                    onClick={
                                        handleForgotOtp
                                    }
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Đang gửi OTP..."
                                        : "Gửi OTP"}
                                </button>

                            )}


                            {otpExpiresAt && (

                                <>

                                    <div className="profile-field">

                                        <label>
                                            Mã OTP
                                        </label>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            value={otp}
                                            onChange={e =>
                                                setOtp(
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                )
                                            }
                                            placeholder="Nhập mã 8 số"
                                            autoFocus
                                            disabled={
                                                loading ||
                                                remainingSeconds <= 0
                                            }
                                        />

                                    </div>


                                    <div className="profile-otp-timer">

                                        {remainingSeconds > 0

                                            ? `OTP còn ${formatOtpTime()}`

                                            : "OTP đã hết hạn"}

                                    </div>


                                    <button
                                        type="button"
                                        className="profile-primary-btn"
                                        onClick={
                                            handleVerifyForgotOtp
                                        }
                                        disabled={
                                            loading ||
                                            remainingSeconds <= 0
                                        }
                                    >
                                        {loading
                                            ? "Đang xác nhận..."
                                            : "Xác nhận OTP"}
                                    </button>


                                    <button
                                        type="button"
                                        className="profile-secondary-btn"
                                        onClick={
                                            handleForgotOtp
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        Gửi lại OTP
                                    </button>

                                </>

                            )}


                            <button
                                type="button"
                                className="profile-back-btn"
                                onClick={
                                    goLogin
                                }
                            >
                                ← Quay lại đăng nhập
                            </button>

                        </div>

                    </>

                )}


                {/* =================================================
                    FORGOT PASSWORD
                ================================================= */}

                {mode === "forgot-password" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                🔑
                            </div>

                            <div>

                                <h2>
                                    Mật khẩu mới
                                </h2>

                                <p>
                                    Tạo mật khẩu mới
                                </p>

                            </div>

                        </div>


                        <div className="profile-content">

                            <div className="profile-field">

                                <label>
                                    Mật khẩu mới
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={e =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ít nhất 6 ký tự"
                                    autoFocus
                                    disabled={loading}
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Xác nhận mật khẩu
                                </label>

                                <input
                                    type="password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={e =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập lại mật khẩu"
                                    disabled={loading}
                                />

                            </div>


                            <button
                                type="button"
                                className="profile-primary-btn"
                                onClick={
                                    handleResetPassword
                                }
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang cập nhật..."
                                    : "Đổi mật khẩu"}
                            </button>

                        </div>

                    </>

                )}


                {/* =================================================
                    PROFILE
                ================================================= */}

                {mode === "profile" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">

                                {email
                                    ? email
                                        .charAt(0)
                                        .toUpperCase()
                                    : "U"}

                            </div>

                            <div>

                                <h2>
                                    Profile
                                </h2>

                                <p>
                                    Quản lý tài khoản
                                </p>

                            </div>

                        </div>


                        <div className="profile-content">

                            <div className="profile-field">

                                <label>
                                    Email
                                </label>

                                <div className="profile-email">
                                    {email ||
                                        "Đang tải..."}
                                </div>

                            </div>


                            <button
                                type="button"
                                className="profile-primary-btn"
                                onClick={
                                    handleChangePasswordOtp
                                }
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang gửi OTP..."
                                    : "Đổi mật khẩu"}
                            </button>


                            <button
                                type="button"
                                className="profile-danger-btn"
                                onClick={
                                    handleSignOut
                                }
                            >
                                Đăng xuất
                            </button>


                 <button
    type="button"
    className="profile-back-btn"
    onClick={handleBack}
>
    ← Quay lại
</button>
                        </div>

                    </>

                )}


                {/* =================================================
                    CHANGE PASSWORD OTP
                ================================================= */}

                {mode === "change-otp" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                🔐
                            </div>

                            <div>

                                <h2>
                                    Xác nhận OTP
                                </h2>

                                <p>
                                    Kiểm tra email của bạn
                                </p>

                            </div>

                        </div>


                        <div className="profile-content">

                            <div className="profile-info">

                                <span>
                                    Mã OTP đã được gửi tới
                                </span>

                                <b>
                                    {email}
                                </b>

                            </div>


                            <div className="profile-field">

                                <label>
                                    Mã OTP
                                </label>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    value={otp}
                                    onChange={e =>
                                        setOtp(
                                            e.target.value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                        )
                                    }
                                    placeholder="Nhập mã 8 số"
                                    autoFocus
                                    disabled={
                                        loading ||
                                        remainingSeconds <= 0
                                    }
                                />

                            </div>


                            <div className="profile-otp-timer">

                                {remainingSeconds > 0

                                    ? `OTP còn ${formatOtpTime()}`

                                    : "OTP đã hết hạn"}

                            </div>


                            <button
                                type="button"
                                className="profile-primary-btn"
                                onClick={
                                    handleVerifyChangeOtp
                                }
                                disabled={
                                    loading ||
                                    remainingSeconds <= 0
                                }
                            >
                                {loading
                                    ? "Đang xác nhận..."
                                    : "Xác nhận OTP"}
                            </button>


                            <button
                                type="button"
                                className="profile-secondary-btn"
                                onClick={
                                    handleChangePasswordOtp
                                }
                                disabled={
                                    loading
                                }
                            >
                                Gửi lại OTP
                            </button>


                            <button
                                type="button"
                                className="profile-back-btn"
                                onClick={
                                    goProfile
                                }
                            >
                                ← Quay lại
                            </button>

                        </div>

                    </>

                )}


                {/* =================================================
                    CHANGE PASSWORD
                ================================================= */}

                {mode === "change-password" && (

                    <>

                        <div className="profile-header">

                            <div className="profile-avatar">
                                🔑
                            </div>

                            <div>

                                <h2>
                                    Đổi mật khẩu
                                </h2>

                                <p>
                                    Nhập mật khẩu mới
                                </p>

                            </div>

                        </div>


                        <div className="profile-content">

                            <div className="profile-field">

                                <label>
                                    Mật khẩu mới
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={e =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ít nhất 6 ký tự"
                                    autoFocus
                                    disabled={loading}
                                />

                            </div>


                            <div className="profile-field">

                                <label>
                                    Xác nhận mật khẩu
                                </label>

                                <input
                                    type="password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={e =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập lại mật khẩu"
                                    disabled={loading}
                                />

                            </div>


                            <button
                                type="button"
                                className="profile-primary-btn"
                                onClick={
                                    handleChangePassword
                                }
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang cập nhật..."
                                    : "Đổi mật khẩu"}
                            </button>


                            <button
                                type="button"
                                className="profile-back-btn"
                                onClick={
                                    goProfile
                                }
                            >
                                ← Quay lại
                            </button>

                        </div>

                    </>

                )}


                {/* =================================================
                    MESSAGE
                ================================================= */}

                {message && (

                    <div className="profile-success">
                        ✓ {message}
                    </div>

                )}


                {error && (

                    <div className="profile-error">
                        {error}
                    </div>

                )}

            </div>

        </div>

    );

}