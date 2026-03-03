import React, { useState } from 'react';
import "./LandingPage.css";
import BillyLogo from "../Images/BillyLogo.svg";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { api } from "apiService";

const LandingPage = () => {
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setLoginData((prev) => ({
            ...prev,
            [id]: value
        }));
    };

    const handleLogin = async () => {
        try {
            const res = await api.post(
                '/api/login',
                loginData,
                { withCredentials: true }
            );

            if (res.data?.success) {
                if (res.data?.layers_matrix?.layers && Array.isArray(res.data.layers_matrix.layers)) {
                    sessionStorage.setItem('layersMatrix', JSON.stringify(res.data.layers_matrix));
                } else {
                    sessionStorage.removeItem('layersMatrix');
                }

                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }
                if (res.data.business_id) {
                    localStorage.setItem('business_id', res.data.business_id);
                }

                navigate('/dashboard');
            } else {
                alert('Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    };

    return (
        <div className="container">
            <div className="content">
                <div className="logo">
                    <span className="logo-text">Willy's Assortment Check</span>


                </div>
                <div className="main-text">

                    <div className="text-bottom">


                        <ul className="features">
                            <li>
                                <span style={{color: 'black', fontWeight: '700'}}>Zekerheid </span> dat je de lokale klanten houdt.
                            </li>
                            <br/>
                            <li>
                                <span style={{color: 'black', fontWeight: '700'}}>Geen hoofdpijn </span>  of discussie, alles helder voor het hele team.
                            </li>

                        </ul>
                    </div>
                </div>


            </div>

            {/* Right Section: Login */}
            <div className="login-container">
                <p className="login-title">Willy</p>

                <div className="login-section">
                    <h3>Login <span>your account</span></h3>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="email"
                            value={loginData.email}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="password"
                            value={loginData.password}
                            onChange={handleInputChange}
                        />
                    </div>

                    <button className="login-btn" onClick={handleLogin}>Login</button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;


/*
<div className="text-bottom">
                        <h2 className="why-billy">Why choose Willy?</h2>
                        <br/>
                        <ul className="features">
                            <li>✔ Certainty about satisfied customers</li>
                            <li>✔ Discover trendy menu items before your competitors</li>
                            <li>✔ Have the right seasonal products</li>
                        </ul>
                    </div>
 */