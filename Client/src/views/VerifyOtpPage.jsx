import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
    const location = useLocation();
    const emailFromSignup = location.state?.email || '';

    const [email, setEmail] = useState(emailFromSignup);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleOtpChange = (e) => {
        // keep digits only, so pasting "123 456" also works
        setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp });
            setSuccess(data.message);
        } catch (err) {
            const res = err.response?.data;
            setError(res?.errors?.[0]?.message || res?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3 text-center">
                <h1 className="text-2xl font-bold">Email Verified</h1>
                <p className="text-green-600">{success}</p>
                <Link to="/login" className="rounded bg-blue-600 p-2 text-white">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-gray-600">
                Enter the {OTP_LENGTH}-digit code sent to {emailFromSignup || 'your email'}.
                It is valid for 10 minutes.
            </p>

            {/* shown only if the page was opened without coming from signup */}
            {!emailFromSignup && (
                <input className="w-full rounded border border-gray-300 p-2" type="email"
                    placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
            )}

            <input
                className="w-full rounded border border-gray-300 p-3 text-center text-2xl tracking-[0.5em]"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="One-time code"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                autoFocus
                required
            />

            {error && <p role="alert" className="text-red-600">{error}</p>}

            <button type="submit" disabled={loading || otp.length !== OTP_LENGTH}
                className="rounded bg-blue-600 p-2 text-white disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify'}
            </button>
        </form>
    );
}
