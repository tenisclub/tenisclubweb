'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import type { UserAddress } from '@/types/database';

export default function MeusEnderecosPage() {
  const { toast } = useStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [label, setLabel] = useState('Casa');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [stateUf, setStateUf] = useState('SP');
  const [reference, setReference] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const loadAddresses = async () => {
    setLoading(true);
    const res = await fetch('/api/account/addresses', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setAddresses(data.addresses || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAddresses();
    const onRealtime = () => {
      void loadAddresses();
    };
    window.addEventListener('tc:realtime-sync', onRealtime);
    return () => window.removeEventListener('tc:realtime-sync', onRealtime);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        zip_code: zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state: stateUf,
        reference,
        is_default: isDefault,
      }),
