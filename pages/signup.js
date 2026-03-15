import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import styles from '../styles/auth.module.css';

export default function Signup() {
    const router = useRouter();
    const { register, error: authError, clearError } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        user_type: 'shopkeeper',
        phone_number: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }
        clearError();
    };

    const validateForm = () => {
        const errors = {};

        if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.password_confirm) {
            errors.password_confirm = 'Passwords do not match';
        }

        if (!formData.username || formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email || !formData.email.includes('@')) {
            errors.email = 'Please enter a valid email';
        }

        if (!formData.first_name) {
            errors.first_name = 'First name is required';
        }

        if (!formData.last_name) {
            errors.last_name = 'Last name is required';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            const result = await register(formData);
            console.log('Registration success:', result);
            router.push('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            // Show all backend errors
            if (err.response?.data) {
                const apiErrors = err.response.data;
                console.error('API errors:', apiErrors);
                if (typeof apiErrors === 'object') {
                    setFieldErrors(apiErrors);
                    // Combine all field errors into a single string for display
                    const allFieldErrors = Object.values(apiErrors)
                        .flat()
                        .join(' ');
                    setError(allFieldErrors || 'Please fix the errors below');
                } else {
                    setError(apiErrors.message || 'Registration failed');
                }
            } else {
                setError(authError || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.formHeader}>
                    <h1>Join Kirana</h1>
                    <p>Create your account to get started</p>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {/* Show all field errors at the top for visibility */}
                {Object.entries(fieldErrors).length > 0 && (
                    <div className={styles.errorAlert}>
                        {Object.entries(fieldErrors).map(([field, msg]) => (
                            <div key={field}>{field}: {Array.isArray(msg) ? msg.join(' ') : msg}</div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="user_type">Account Type</label>
                        <select
                            id="user_type"
                            name="user_type"
                            value={formData.user_type}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="shopkeeper">Shopkeeper</option>
                            <option value="dealer">Dealer</option>
                        </select>
                    </div>

                    <div className={styles.twoColumns}>
                        <div className={styles.formGroup}>
                            <label htmlFor="first_name">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="John"
                                disabled={isLoading}
                            />
                            {fieldErrors.first_name && (
                                <span className={styles.fieldError}>{fieldErrors.first_name}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="last_name">Last Name</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Doe"
                                disabled={isLoading}
                            />
                            {fieldErrors.last_name && (
                                <span className={styles.fieldError}>{fieldErrors.last_name}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            disabled={isLoading}
                        />
                        {fieldErrors.email && (
                            <span className={styles.fieldError}>{fieldErrors.email}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose your username"
                            disabled={isLoading}
                        />
                        {fieldErrors.username && (
                            <span className={styles.fieldError}>{fieldErrors.username}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="phone_number">Phone Number (Optional)</label>
                        <input
                            type="tel"
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.twoColumns}>
                        <div className={styles.formGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimum 8 characters"
                                disabled={isLoading}
                            />
                            {fieldErrors.password && (
                                <span className={styles.fieldError}>{fieldErrors.password}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password_confirm">Confirm Password</label>
                            <input
                                type="password"
                                id="password_confirm"
                                name="password_confirm"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                disabled={isLoading}
                            />
                            {fieldErrors.password_confirm && (
                                <span className={styles.fieldError}>{fieldErrors.password_confirm}</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className={styles.switchAuth}>
                    Already have an account?{' '}
                    <a href="/login" className={styles.link}>
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}
