import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import styles from '../styles/auth.module.css';

export default function Login() {
    const router = useRouter();
    const { login, error: authError, clearError } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.username || !formData.password) {
            setError('Login failed');
            return;
        }
        
        setIsLoading(true);

        try {
            await login(formData.username, formData.password);
            router.push('/dashboard');
        } catch (err) {
            console.error("Login error object:", err);
            // The Cypress test explicitly looks for "Login failed"
            setError('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.formHeader}>
                    <h1>Welcome back to Kirana</h1>
                    <p>Login to your account to continue</p>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className={styles.divider}>OR</div>

                <div className={styles.socialLogin}>
                    <GoogleSignInButton buttonLabel="Sign in with Google" />
                </div>

                <p className={styles.switchAuth}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className={styles.link}>
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
