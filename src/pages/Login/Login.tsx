"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    supabase,
} from "@/lib/supabase";

import {
    useEditorStore,
} from "@/stores/editor.store";

import "./Login.css";


interface LoginProps {

    onRegisterClick?: () => void;

}


type Step =
    | "login"
    | "forgot"
    | "otp"
    | "new-password";


export default function Login({
    onRegisterClick,
}: LoginProps) {

    const setWorkspace =
        useEditorStore(
            state =>
                state.setWorkspace
        );


    const [step, setStep] =
        useState<Step>("login");


    const [email, setEmail] =
        useState("");


    const [password, setPassword] =
        useState("");


    const [otp, setOtp] =
        useState("");


    const [newPassword, setNewPassword] =
        useState("");


    const [confirmPassword, setConfirmPassword] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [message, setMessage] =
        useState("");


    const [remainingSeconds, setRemainingSeconds] =
        useState(0);


    // =========================================================
    // LOGIN
    // =========================================================

    async function handleLogin(
        e: FormEvent
    ) {

        e.preventDefault();

        setError("");

        setMessage("");


        const cleanEmail =
            email.trim().toLowerCase();


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
                data,
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


            console.log(
                "[LOGIN] Success:",
                data.user?.email
            );


            // Đăng nhập thành công
            setWorkspace("style");

        }

        catch (err) {

            console.error(
                "[LOGIN] Error:",
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
    // SEND FORGOT PASSWORD OTP
    // =========================================================

    async function handleSendForgotOtp() {

        setError("");

        setMessage("");


        const cleanEmail =
            email.trim().toLowerCase();


        if (!cleanEmail) {

            setError(
                "Vui lòng nhập email."
            );

            return;

        }


        setLoading(true);


        try {

            /*
             * Gửi OTP.
             *
             * shouldCreateUser = false
             * để không tạo tài khoản mới.
             */

            const {
                error,
            } =
                await supabase.auth.signInWithOtp({

                    email:
                        cleanEmail,

                    options: {

                        shouldCreateUser:
                            false,

                    },

                });


            if (error) {

                throw error;

            }


            setStep("otp");

            setOtp("");

            setRemainingSeconds(300);

            setMessage(
                `Mã OTP đã được gửi tới ${cleanEmail}.`
            );


            // =================================================
            // COUNTDOWN 5 PHÚT
            // =================================================

            let seconds = 300;


            const timer =
                window.setInterval(() => {

                    seconds--;

                    setRemainingSeconds(
                        seconds
                    );


                    if (
                        seconds <= 0
                    ) {

                        window.clearInterval(
                            timer
                        );

                    }

                }, 1000);

        }

        catch (err) {

            console.error(
                "[FORGOT PASSWORD] OTP ERROR:",
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
    // VERIFY OTP
    // =========================================================

    async function handleVerifyOtp() {

        setError("");

        setMessage("");


        if (
            remainingSeconds <= 0
        ) {

            setError(
                "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới."
            );

            return;

        }


        if (
            otp.trim().length !== 6
        ) {

            setError(
                "Vui lòng nhập mã OTP 6 số."
            );

            return;

        }


        setLoading(true);


        try {

            const {
                error,
            } =
                await supabase.auth.verifyOtp({

                    email:
                        email.trim().toLowerCase(),

                    token:
                        otp.trim(),

                    type:
                        "email",

                });


            if (error) {

                throw error;

            }


            setStep(
                "new-password"
            );

            setMessage(
                "OTP chính xác. Bạn có thể tạo mật khẩu mới."
            );

        }

        catch (err) {

            console.error(
                "[FORGOT PASSWORD] VERIFY OTP ERROR:",
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
    // UPDATE PASSWORD
    // =========================================================

    async function handleUpdatePassword() {

        setError("");

        setMessage("");


        if (
            newPassword.length < 6
        ) {

            setError(
                "Mật khẩu phải có ít nhất 6 ký tự."
            );

            return;

        }


        if (
            newPassword !==
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

                    password:
                        newPassword,

                });


            if (error) {

                throw error;

            }


            setPassword("");

            setNewPassword("");

            setConfirmPassword("");

            setOtp("");

            setStep("login");


            setMessage(
                "Đổi mật khẩu thành công. Hãy đăng nhập lại."
            );

        }

        catch (err) {

            console.error(
                "[FORGOT PASSWORD] UPDATE PASSWORD ERROR:",
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
    // FORMAT TIMER
    // =========================================================

    const minutes =
        Math.floor(
            remainingSeconds / 60
        );


    const seconds =
        remainingSeconds % 60;


    const timerText =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    // =========================================================
    // LOGIN
    // =========================================================

    if (step === "login") {

        return (

            <div className="login-page">

                <div className="login-card">

                    <div className="login-header">

                        <h1>
                            SubKaraokeAI
                        </h1>

                        <h2>
                            Đăng nhập
                        </h2>

                        <p>
                            Đăng nhập để sử dụng
                            SubKaraokeAI.
                        </p>

                    </div>


                    <form
                        className="login-form"
                        onSubmit={handleLogin}
                    >

                        <div className="login-field">

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


                        <div className="login-field">

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


                        {error && (

                            <div className="login-error">
                                {error}
                            </div>

                        )}


                        {message && (

                            <div className="login-success">
                                ✓ {message}
                            </div>

                        )}


                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Đang đăng nhập..."
                                : "Đăng nhập"}

                        </button>

                    </form>


                    <button
                        type="button"
                        className="login-forgot"
                        onClick={() => {

                            setError("");

                            setMessage("");

                            setStep("forgot");

                        }}
                    >
                        Quên mật khẩu?
                    </button>


                    <div className="login-footer">

                        <span>
                            Chưa có tài khoản?
                        </span>

                        <button
                            type="button"
                            onClick={
                                onRegisterClick
                            }
                            disabled={loading}
                        >
                            Đăng ký
                        </button>

                    </div>


                    <button
                        type="button"
                        className="login-back"
                        onClick={() =>
                            setWorkspace("style")
                        }
                    >
                        ← Quay lại
                    </button>

                </div>

            </div>

        );

    }


    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (step === "forgot") {

        return (

            <div className="login-page">

                <div className="login-card">

                    <div className="login-header">

                        <h1>
                            Quên mật khẩu
                        </h1>

                        <p>
                            Nhập email tài khoản.
                            Chúng tôi sẽ gửi mã OTP
                            để đặt lại mật khẩu.
                        </p>

                    </div>


                    <div className="login-field">

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
                            autoFocus
                            disabled={loading}
                        />

                    </div>


                    {error && (

                        <div className="login-error">
                            {error}
                        </div>

                    )}


                    {message && (

                        <div className="login-success">
                            ✓ {message}
                        </div>

                    )}


                    <button
                        type="button"
                        className="login-submit"
                        onClick={
                            handleSendForgotOtp
                        }
                        disabled={loading}
                    >

                        {loading
                            ? "Đang gửi OTP..."
                            : "Gửi mã OTP"}

                    </button>


                    <button
                        type="button"
                        className="login-back"
                        onClick={() => {

                            setError("");

                            setMessage("");

                            setStep("login");

                        }}
                    >
                        ← Quay lại đăng nhập
                    </button>

                </div>

            </div>

        );

    }


    // =========================================================
    // OTP
    // =========================================================

    if (step === "otp") {

        return (

            <div className="login-page">

                <div className="login-card">

                    <div className="login-header">

                        <h1>
                            Xác nhận OTP
                        </h1>

                        <p>
                            Mã OTP đã được gửi tới
                        </p>

                        <strong>
                            {email}
                        </strong>

                    </div>


                    <div className="login-otp-timer">

                        Mã hết hạn sau{" "}

                        <strong>
                            {timerText}
                        </strong>

                    </div>


                    <div className="login-field">

                        <label>
                            Mã OTP
                        </label>

                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={e =>
                                setOtp(
                                    e.target.value.replace(
                                        /\D/g,
                                        ""
                                    )
                                )
                            }
                            placeholder="000000"
                            autoFocus
                            disabled={loading}
                        />

                    </div>


                    {error && (

                        <div className="login-error">
                            {error}
                        </div>

                    )}


                    {message && (

                        <div className="login-success">
                            ✓ {message}
                        </div>

                    )}


                    <button
                        type="button"
                        className="login-submit"
                        onClick={
                            handleVerifyOtp
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
                        className="login-secondary"
                        onClick={
                            handleSendForgotOtp
                        }
                        disabled={
                            loading ||
                            remainingSeconds > 0
                        }
                    >
                        Gửi lại OTP
                    </button>


                    <button
                        type="button"
                        className="login-back"
                        onClick={() => {

                            setError("");

                            setMessage("");

                            setStep("forgot");

                        }}
                    >
                        ← Quay lại
                    </button>

                </div>

            </div>

        );

    }


    // =========================================================
    // NEW PASSWORD
    // =========================================================

    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <h1>
                        Mật khẩu mới
                    </h1>

                    <p>
                        Tạo mật khẩu mới cho tài khoản
                    </p>

                </div>


                <div className="login-field">

                    <label>
                        Mật khẩu mới
                    </label>

                    <input
                        type="password"
                        value={newPassword}
                        onChange={e =>
                            setNewPassword(
                                e.target.value
                            )
                        }
                        placeholder="Ít nhất 6 ký tự"
                        autoFocus
                        disabled={loading}
                    />

                </div>


                <div className="login-field">

                    <label>
                        Xác nhận mật khẩu
                    </label>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                        placeholder="Nhập lại mật khẩu"
                        disabled={loading}
                    />

                </div>


                {error && (

                    <div className="login-error">
                        {error}
                    </div>

                )}


                {message && (

                    <div className="login-success">
                        ✓ {message}
                    </div>

                )}


                <button
                    type="button"
                    className="login-submit"
                    onClick={
                        handleUpdatePassword
                    }
                    disabled={loading}
                >

                    {loading
                        ? "Đang cập nhật..."
                        : "Đổi mật khẩu"}

                </button>

            </div>

        </div>

    );

}