import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddaLogo from "../components/AddaLogo";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const initialForm = {email: "", password: "" };
const fields = [
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
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

export default function LoginPage(){
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm( (prev)=> ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try{
            const {data} = await axios.post(`${API_BASE_URL}/auth.login`, form);
            console.log("Login successful:", data);
            setSuccess(data.message);
            setForm(initialForm);

            navigate("/", { state: { email: form.email } });

        }catch(err){
            const res= err.response?.data;
            setError(res?.errors?.[0]?.message || res?.message || "Login failed. Please try again.");
        }finally{
            setLoading(false);
        }
    }

    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-2">
            <BrandPanel/>
            <section className="flex items-center justify-center px-6 py-10">
                <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
                    <div className="">
                        <h1 className="text-2xl font-bold">Login to your account</h1>
                        <p className=" mt-2 text-gray-600">Enter your credentials to access your account.</p>
                    </div>
                    {fields.map(({label, ...field})=> (
                        <label key={field.name} className="block text-sm font-medium text-gray-700">
                            {label}
                            <input
                                {...field}
                                value={form[field.name]}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </label>
                    ))}
                    {error && <p role="alert" className="text-red-600">{error}</p>}
                    {success && <p role="status" className="text-green-700">{success}</p>}

                    <button type="submit" disabled={loading} className="mt-4 w-full rounded-md bg-[#123C3A] px-4 py-2 text-white hover:bg-[#0f2e2d] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                </section>
        </main>
    )
}