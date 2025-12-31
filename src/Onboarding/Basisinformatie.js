import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layoutOnboarding.js';
import { useOnboarding } from './OnboardingContext';
import './Basisinformatie.css';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { api } from "apiService";

const FIELD_DEFS = {
    manager_first_name: { label: 'Voornaam Manager', placeholder: 'Voornaam Manager', type: 'text' },
    manager_last_name:  { label: 'Achternaam Manager', placeholder: 'Achternaam Manager', type: 'text' },
    horeca_name:        { label: 'Naam Horecazaak', placeholder: 'Naam Horecazaak', type: 'text' },
    email:              { label: 'E-mail', placeholder: 'E-mail', type: 'email' },
    password:           { label: 'Kies een wachtwoord', placeholder: 'Wachtwoord', type: 'password' },
    address:            { label: 'Address', placeholder: 'Address', type: 'text' },
    phonenumber:        { label: 'Telefoonnummer (optioneel)', placeholder: 'Telefoonnummer', type: 'tel' },
    passwordrepeat:     { label: 'Herhaal wachtwoord', placeholder: 'Wachtwoord', type: 'password' },
};
const ALL_KEYS = Object.keys(FIELD_DEFS);

// Visible in the UI
const VISIBLE_KEYS = ['manager_first_name', 'email', 'phonenumber'];

// Fields your backend wants non-empty. We'll fill if hidden/empty.
const REQUIRED_SERVER_FIELDS = [
    'manager_first_name',
    'horeca_name',      // has a UNIQUE constraint on the DB
    'email',
    'password',
    'manager_last_name',
    'address',
    'phonenumber',      // server seems to require it non-empty, even if optional in UI
];

const PLACEHOLDER = 'N/A';

const makeTempPassword = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

// Create a unique, DB-safe temporary horeca name to satisfy the unique constraint
const makeTempHorecaName = (base) => {
    const fromFirst = String(base.manager_first_name || 'zaak')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `TEMP-${fromFirst || 'zaak'}-${stamp}`;
};

const Basisinformatie = () => {
    const navigate = useNavigate();
    const { onboardingData, updateOnboardingData } = useOnboarding();

    const [formData, setFormData] = useState(() => {
        const base = {};
        for (const k of ALL_KEYS) base[k] = (onboardingData && onboardingData[k]) || '';
        return base;
    });

    const visibleFields = useMemo(
        () => VISIBLE_KEYS.map(key => ({ key, ...FIELD_DEFS[key] })),
        []
    );

    const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const validate = () => {
        if (!formData.manager_first_name.trim()) {
            alert('Vul de voornaam van de manager in.');
            return false;
        }
        const email = formData.email.trim();
        if (!email) {
            alert('Vul het e-mailadres in.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Voer een geldig e-mailadres in.');
            return false;
        }
        return true;
    };

    const buildPayload = (raw) => {
        const payload = { ...raw };

        // Ensure keys exist as strings
        for (const k of ALL_KEYS) if (payload[k] == null) payload[k] = '';

        // Password: always non-empty hash (real if provided/visible, else temp)
        const passwordProvided = (payload.password ?? '').trim().length > 0;
        if (VISIBLE_KEYS.includes('password') || VISIBLE_KEYS.includes('passwordrepeat')) {
            if (payload.password !== payload.passwordrepeat) {
                throw new Error('Wachtwoorden matchen niet!');
            }
            payload.password = passwordProvided
                ? bcrypt.hashSync(payload.password, 10)
                : bcrypt.hashSync(makeTempPassword(), 10);
        } else {
            payload.password = bcrypt.hashSync(makeTempPassword(), 10);
        }
        delete payload.passwordrepeat; // never send repeat

        // Phone: server expects non-empty — use actual value or placeholder
        const phone = String(raw.phonenumber || '').trim() || PLACEHOLDER;
        payload.phonenumber = phone;
        payload.phone = phone;        // alias
        payload.phoneNumber = phone;  // alias

        // Fill other required fields with placeholders if empty
        REQUIRED_SERVER_FIELDS.forEach((key) => {
            if (key === 'horeca_name') return; // handle separately for uniqueness
            if (!String(payload[key] || '').trim()) payload[key] = PLACEHOLDER;
        });

        // horeca_name: ensure NON-EMPTY and UNIQUE-ish to avoid DB unique violations
        if (!String(payload.horeca_name || '').trim() || payload.horeca_name === PLACEHOLDER) {
            payload.horeca_name = makeTempHorecaName(payload);
            console.warn('Auto-generated temp horeca_name to satisfy unique constraint:', payload.horeca_name);
        }

        return payload;
    };

    const handleNext = async () => {
        console.clear();
        console.log('%cOnboarding Data (before processing):', 'color: green; font-size: 14px; font-weight: bold;');
        console.table(formData);

        if (!validate()) return;

        let payload;
        try {
            payload = buildPayload(formData);
        } catch (e) {
            alert(e.message || 'Validatie mislukt.');
            return;
        }

        console.log('%cOnboarding Data (final payload):', 'color: blue; font-size: 14px; font-weight: bold;');
        console.table(payload);

        try {
            const res = await api.post('/api/complete-onboarding', payload, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            });
            console.log('Server response:', res?.data);
        } catch (error) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            console.error('Error sending data to server:', error);
            console.error('Server status:', status, 'Server body:', data);
            alert(`Server error (${status || 'unknown'}): ${data?.message || data?.error || 'Zie console voor details.'}`);
            return;
        }

        updateOnboardingData(null, payload);
        navigate('/typehoreca');
    };

    return (
        <Layout title="Contactinformatie" progress={20}>
            <div className="form-container">
                {visibleFields.map(({ key, label, placeholder, type }) => (
                    <div className="form-section" key={key}>
                        <label>{label}</label>
                        <input
                            type={type}
                            placeholder={placeholder}
                            value={formData[key] || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            required={key === 'manager_first_name' || key === 'email'}
                            autoComplete={
                                key === 'email'
                                    ? 'email'
                                    : key === 'phonenumber'
                                        ? 'tel'
                                        : 'given-name'
                            }
                            inputMode={key === 'phonenumber' ? 'tel' : 'text'}
                        />
                    </div>
                ))}
            </div>

            <div className="start-button-container">
                <button className="start-button" onClick={handleNext}>
                    Volgende
                </button>
            </div>
        </Layout>
    );
};

export default Basisinformatie;
