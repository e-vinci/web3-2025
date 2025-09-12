import { useState } from 'react';

interface TopUpAddProps {
    addTopUp: (topup: { user: string; amount: string }) => void;
}

export default function TopUpAdd({ addTopUp }: TopUpAddProps) {
    const [user, setUser] = useState('Alice');
    const [amount, setAmount] = useState('');
    // Faulty: no validation, no error messages

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addTopUp({ user, amount });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={user} onChange={e => setUser(e.target.value)}>
                <option value="Alice">Alice</option>
                <option value="Bob">Bob</option>
            </select>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
            <button type="submit">Top Up</button>
        </form>
    );
}
