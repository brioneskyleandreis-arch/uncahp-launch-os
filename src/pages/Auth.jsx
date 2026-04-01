import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, ArrowRight, Loader, User } from 'lucide-react';

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(location.pathname === '/login');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp, user } = useAuth();
    const { addToast } = useToast();

    // Auto-redirect if already logged in — send back to the page they came from
    useEffect(() => {
        console.log(`[Auth.jsx] Redirect Check: user=${!!user}`);
        if (user) {
            const destination = location.state?.from || '/';
            console.log(`[Auth.jsx] Executing navigate to ${destination}`);
            navigate(destination, { replace: true });
        }
    }, [user, navigate, location.state]);

    // Context switching based on route or interactions
    useEffect(() => {
        setIsLogin(location.pathname === '/login');
    }, [location.pathname]);

    const handleSwitch = (mode) => {
        setIsLogin(mode === 'login');
        navigate(mode === 'login' ? '/login' : '/signup');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn({ email, password });
                if (error) throw error;
                addToast('Successfully logged in!', 'success');
            } else {
                const { data, error } = await signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (error) throw error;
                addToast('Account created! Please check your email for verification.', 'success');
                handleSwitch('login');
            }
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#0f1014] p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[120px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(244, 140, 207, 0.4) 0%, transparent 70%)',
                        animation: 'aurora-float-1 25s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(192, 132, 252, 0.35) 0%, transparent 70%)',
                        animation: 'aurora-float-2 30s ease-in-out infinite'
                    }}
                />
            </div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500 ease-in-out">
                <div className="text-center mb-8">
                    <img src="/UNCAHP LOGO.png" alt="UNCAHP Logo" className="h-12 w-auto mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-[--text-muted]">
                        {isLogin ? 'Sign in to access UNCAHP' : 'Join UNCAHP today'}
                    </p>
                </div>

                <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    {/* Tabs */}
                    <div className="flex p-1 bg-[--bg-surface] rounded-xl mb-6">
                        <button
                            onClick={() => handleSwitch('login')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isLogin
                                ? 'bg-[--bg-card] text-[--text-main] shadow-sm'
                                : 'text-[--text-muted] hover:text-[--text-main]'
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => handleSwitch('signup')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${!isLogin
                                ? 'bg-[--bg-card] text-[--text-main] shadow-sm'
                                : 'text-[--text-muted] hover:text-[--text-main]'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Full Name - Only for Signup */}
                        {!isLogin && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="text-sm font-medium text-[--text-muted] ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] group-focus-within:text-[--primary] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[--bg-app] border border-[--border] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[--primary] transition-colors"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[--text-muted] ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] group-focus-within:text-[--primary] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[--bg-app] border border-[--border] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[--primary] transition-colors"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[--text-muted] ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] group-focus-within:text-[--primary] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[--bg-app] border border-[--border] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[--primary] transition-colors"
                                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Auth;
