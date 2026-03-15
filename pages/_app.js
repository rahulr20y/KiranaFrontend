import '../styles/global.css'
import { AuthProvider } from '../lib/authContext'

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    )
}

export default MyApp
