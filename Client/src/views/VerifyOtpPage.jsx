import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AddaLogo from '../components/AddaLogo';

const API_BASE_URL = 'http://localhost:5000/api';
const OTP_LENGTH = 6;

const messages = [
  { text: "Chai at 6? Everyone's coming.", mine: false },
  { text: "Save me a seat!", mine: true },
  { text: "Bring your best stories.", mine: false },
];

function BrandPanel() {
  return (
    <section className="hidden flex-col justify-between gap-10 bg-[#123C3A] p-12 text-white lg:flex xl:p-16">
      <AddaLogo className="w-44" />

      <div className="max-w-lg">
        <h2 className="text-5xl font-extrabold leading-tight">
          Pull up a chair. Your friends are talking.
        </h2>
        <p className="mt-4 text-lg text-teal-100">
          Adda is where your chats feel like an evening with your people.
        </p>
      </div>

      <ul aria-hidden="true" className="flex w-full max-w-md flex-col gap-3">
        {messages.map(({ text, mine }) => (
          <li
            key={text}
            className={`w-fit rounded-3xl px-5 py-3 ${
              mine
                ? "self-end rounded-br-md bg-[#F4B63F] text-[#123C3A]"
                : "self-start rounded-bl-md bg-white/10"
            }`}
          >
            {text}
          </li>
        ))}
        <li className="flex w-fit gap-1.5 rounded-3xl rounded-bl-md bg-white/10 px-5 py-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
              className="size-2 rounded-full bg-teal-100 motion-safe:animate-bounce"
            />
          ))}
        </li>
      </ul>
    </section>
  );
}

export default function VerifyOtpPage() {
    const location = useLocation();
    const emailFromSignup = location.state?.email || '';
    console.log('emailFromSignup:', emailFromSignup);
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
          <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3 bounder rounded-lg border-gray-300 p-2 shadow-sm">
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
        </section>
        </main>
    );
}
