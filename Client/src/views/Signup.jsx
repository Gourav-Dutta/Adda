import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AddaLogo from "../components/AddaLogo";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const initialForm = { name: "", email: "", phone: "", password: "" };

const fields = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", minLength: 10 },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", minLength: 6 },
];

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

export default function SignUpPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setRegisteredEmail("");

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, form);
      setSuccess(data.message);
      setRegisteredEmail(form.email);
      setForm(initialForm);
    } catch (err) {
      const res = err.response?.data;
      setError(
        res?.errors?.[0]?.message ||
          res?.message ||
          "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <BrandPanel />

      <section className="flex items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <AddaLogo className="mx-auto w-36 lg:hidden" />

          <div>
            <h1 className="text-3xl font-bold text-[#123C3A]">Create your account</h1>
            <p className="mt-1 text-gray-600">Join Adda and start chatting.</p>
          </div>

          {fields.map(({ label, ...field }) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              {label}
              <input
                {...field}
                value={form[field.name]}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-normal text-gray-900 outline-none focus:border-[#123C3A] focus:ring-2 focus:ring-[#123C3A]/25"
              />
            </label>
          ))}

          {error && <p role="alert" className="text-red-600">{error}</p>}
          {success && <p role="status" className="text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-xl bg-[#123C3A] py-3 font-semibold text-white hover:bg-[#1B5450] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>

          {registeredEmail && (
            <Link
              to="/verify-otp"
              state={{ email: registeredEmail }}
              className="rounded-xl border-2 border-[#123C3A] py-2.5 text-center font-semibold text-[#123C3A] hover:bg-teal-50"
            >
              Verify account
            </Link>
          )}
        </form>
      </section>
    </main>
  );
}
