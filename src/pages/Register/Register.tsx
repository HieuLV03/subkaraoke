"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    supabase,
} from "@/lib/supabase";

import "./Register.css";


interface RegisterProps {

    onRegisterSuccess?: () => void;

    onLoginClick?: () => void;

}


export default function Register({

    onRegisterSuccess,

    onLoginClick,

}: RegisterProps) {

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================================================
    // REGISTER
    // =========================================================

    const handleRegister =
        async (
            e: FormEvent
        ) => {

            e.preventDefault();

            setError("");


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


            if (password.length < 6) {

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
                    error: signUpError,
                } =
                    await supabase.auth.signUp({

                        email:
                            cleanEmail,

                        password,

                    });


                if (signUpError) {

                    throw signUpError;

                }


                console.log(
                    "[REGISTER] Success:",
                    data
                );


                // =================================================
                // SESSION ĐƯỢC TẠO NGAY
                // =================================================

                if (data.session) {

                    onRegisterSuccess?.();

                    return;

                }


                // =================================================
                // EMAIL CONFIRMATION VẪN BẬT
                // =================================================

                setError(
                    "Tài khoản đã được tạo. Vui lòng đăng nhập."
                );

            }

            catch (err) {

                console.error(
                    "[REGISTER] Error:",
                    err
                );


                if (
                    err instanceof Error
                ) {

                    setError(
                        err.message
                    );

                }

                else {

                    setError(
                        "Đăng ký thất bại."
                    );

                }

            }

            finally {

                setLoading(false);

            }

        };


    return (

        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-header">

                    <h1>
                        SubKaraokeAI
                    </h1>

                    <h2>
                        Tạo tài khoản
                    </h2>

                    <p>
                        Đăng ký tài khoản để sử dụng
                        SubKaraokeAI.
                    </p>

                </div>


                <form
                    className="auth-form"
                    onSubmit={
                        handleRegister
                    }
                >

                    <div className="form-group">

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


                    <div className="form-group">

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


                    <div className="form-group">

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
                            autoComplete="new-password"
                            disabled={loading}
                        />

                    </div>


                    {error && (

                        <div className="auth-error">
                            {error}
                        </div>

                    )}


                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Đang tạo tài khoản..."
                            : "Đăng ký"}

                    </button>

                </form>


                <div className="auth-footer">

                    <span>
                        Đã có tài khoản?
                    </span>

                    <button
                        type="button"
                        onClick={
                            onLoginClick
                        }
                        disabled={loading}
                    >
                        Đăng nhập
                    </button>

                </div>

            </div>

        </div>

    );

}