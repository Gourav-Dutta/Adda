import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const initialForm = { name: '', email: '', phone: '', password: '' };

export default function SignUpPage() {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, form);
            setSuccess(data.message);
            setForm(initialForm);
        } catch (err) {
            const res = err.response?.data;
            setError(res?.errors?.[0]?.message || res?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'w-full rounded border border-gray-300 p-2';

    return (
        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
            <h1 className="text-2xl font-bold">Sign Up</h1>

            <input className={inputClass} type="text" name="name" placeholder="Name"
                value={form.name} onChange={handleChange} required />
            <input className={inputClass} type="email" name="email" placeholder="Email"
                value={form.email} onChange={handleChange} required />
            <input className={inputClass} type="tel" name="phone" placeholder="Phone Number"
                value={form.phone} onChange={handleChange} minLength={10} required />
            <input className={inputClass} type="password" name="password" placeholder="Password"
                value={form.password} onChange={handleChange} minLength={6} required />

            {error && <p className="text-red-600">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}

            <button type="submit" disabled={loading}
                className="rounded bg-blue-600 p-2 text-white disabled:opacity-50">
                {loading ? 'Signing up...' : 'Sign Up'}
            </button>
        </form>
    );
}