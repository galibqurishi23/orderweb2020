'use server';

import pool from './db';
import type { Customer, Address } from './types';

export async function getCustomers(): Promise<Customer[]> {
    const [rows] = await pool.query('SELECT * FROM customers');
    return (rows as any[]).map(c => ({...c, addresses: []}));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    const [customerRows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if ((customerRows as any[]).length === 0) {
        return null;
    }
    const customer = (customerRows as any)[0];
    
    const [addressRows] = await pool.query('SELECT * FROM addresses WHERE customerId = ?', [id]);
    customer.addresses = addressRows;

    return customer as Customer;
}

export async function validateCustomer(email: string, pass: string): Promise<Customer | null> {
    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ? AND password = ?', [email, pass]);
    if ((rows as any[]).length > 0) {
        return await getCustomerById((rows as any)[0].id);
    }
    return null;
}

export async function updateCustomerDetails(customerId: string, details: Partial<Customer>): Promise<void> {
    const { name, phone } = details;
    await pool.query('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [name, phone, customerId]);
}

export async function addAddress(customerId: string, address: Omit<Address, 'id'>): Promise<void> {
    const { street, city, postcode, isDefault } = address;
    const id = `addr-${Date.now()}`;
    await pool.query('INSERT INTO addresses (id, street, city, postcode, isDefault, customerId) VALUES (?, ?, ?, ?, ?, ?)', [id, street, city, postcode, isDefault, customerId]);
}

export async function deleteAddress(addressId: string): Promise<void> {
    await pool.query('DELETE FROM addresses WHERE id = ?', [addressId]);
}
