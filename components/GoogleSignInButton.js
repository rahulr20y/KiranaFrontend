import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import styles from '../styles/auth.module.css';

/**
 * A polished "Sign in with Google" button that:
 * 1. Triggers Firebase Google Popup
 * 2. Gets the Firebase ID token
 * 3. POSTs it to our Django backend via authContext.googleLogin
 * 4. On success, redirects to /dashboard
 *
 * For NEW users, we first show a modal asking for their user_type
 * (shopkeeper / dealer) before completing signup.
 */
export default function GoogleSignInButton({ redirectTo = '/dashboard', buttonLabel = 'Continue with Google' }) {
    const router = useRouter();
    const { googleLogin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [pendingToken, setPendingToken] = useState(null);
    const [selectedType, setSelectedType] = useState('shopkeeper');

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            const idToken = await signInWithGoogle();

            // Try a "probe" call without user_type; backend will tell us if this is a new user
            try {
                const result = await googleLogin(idToken, null);
                if (result.is_new_user) {
                    // If somehow backend created user without type (shouldn't happen),
                    // still show modal as fallback
                }
                router.push(redirectTo);
            } catch (err) {
                const msg = err.response?.data?.detail || '';
                if (msg.includes('user_type is required')) {
                    // New user — show modal to pick account type
                    setPendingToken(idToken);
                    setShowTypeModal(true);
                    setIsLoading(false);
                    return;
                }
                throw err;
            }
        } catch (err) {
            // User closed popup or network error
            const msg = err.code === 'auth/popup-closed-by-user'
                ? 'Sign-in popup was closed. Please try again.'
                : err.response?.data?.detail || 'Google sign-in failed. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTypeSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            await googleLogin(pendingToken, selectedType);
            setShowTypeModal(false);
            router.push(redirectTo);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to complete signup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <button
                id="google-signin-btn"
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span>Connecting...</span>
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                        <span>{buttonLabel}</span>
                    </>
                )}
            </button>

            {/* User Type Selection Modal for new Google users */}
            {showTypeModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Almost there! 🎉</h2>
                            <p>One last step — tell us how you'll use Kirana</p>
                        </div>

                        <div className={styles.typeOptions}>
                            <label
                                className={`${styles.typeCard} ${selectedType === 'shopkeeper' ? styles.typeCardSelected : ''}`}
                                htmlFor="type-shopkeeper"
                            >
                                <input
                                    type="radio"
                                    id="type-shopkeeper"
                                    name="user_type_modal"
                                    value="shopkeeper"
                                    checked={selectedType === 'shopkeeper'}
                                    onChange={() => setSelectedType('shopkeeper')}
                                />
                                <span className={styles.typeIcon}>🛒</span>
                                <strong>Shopkeeper</strong>
                                <span>I buy products for my shop</span>
                            </label>

                            <label
                                className={`${styles.typeCard} ${selectedType === 'dealer' ? styles.typeCardSelected : ''}`}
                                htmlFor="type-dealer"
                            >
                                <input
                                    type="radio"
                                    id="type-dealer"
                                    name="user_type_modal"
                                    value="dealer"
                                    checked={selectedType === 'dealer'}
                                    onChange={() => setSelectedType('dealer')}
                                />
                                <span className={styles.typeIcon}>🏭</span>
                                <strong>Dealer / Wholesaler</strong>
                                <span>I sell products in bulk</span>
                            </label>
                        </div>

                        {error && <div className={styles.errorAlert}>{error}</div>}

                        <button
                            id="confirm-user-type-btn"
                            className={styles.submitBtn}
                            onClick={handleTypeSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating account...' : 'Get Started →'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
