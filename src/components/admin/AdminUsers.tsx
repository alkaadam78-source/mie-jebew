import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types';
import {
  apiGetAdminUsers,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiDeleteAdminUser,
  apiGetMe,
} from '../../services/api';
import {
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from '../ui/Icons';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR',
    is_active: 1,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, usersRes] = await Promise.all([apiGetMe(), apiGetAdminUsers()]);
      setCurrentUser(meRes.user);
      setUsers(usersRes.users || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat pengguna admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'ADMIN',
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // blank by default unless changing
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) {
      showToast('Username dan Nama lengkap wajib diisi', 'error');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      showToast('Password wajib diisi untuk pengguna baru', 'error');
      return;
    }

    try {
      if (editingUser) {
        const payload: any = {
          username: formData.username.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await apiUpdateAdminUser(editingUser.id, payload);
        showToast('Pengguna admin berhasil diperbarui', 'success');
      } else {
        await apiCreateAdminUser({
          username: formData.username.trim(),
          password: formData.password.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          is_active: formData.is_active,
        });
        showToast('Pengguna admin baru berhasil dibuat', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengguna admin', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteAdminUser(id);
      showToast('Pengguna admin berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pengguna admin', 'error');
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-brand-yellow text-black' : 'bg-brand-red text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border-2 border-black shadow-[4px_4px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Admin & User Management
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Kelola akun pengelola CMS, hak akses (Super Admin, Admin, Editor), dan keamanan login
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-bold transition-transform active:scale-95"
            title="Refresh"
          >
            <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Tambah Admin</span>
            </button>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-yellow-100 border-2 border-black font-bold text-xs text-neutral-800 flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-brand-red flex-shrink-0" />
          <span>
            Hanya <strong>SUPER_ADMIN</strong> yang memiliki wewenang untuk menambah atau menghapus akun pengelola lain.
          </span>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat daftar admin...</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black text-xs font-black uppercase text-neutral-700 tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">No. WhatsApp / HP</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200 text-sm font-bold">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      !u.is_active ? 'opacity-60 bg-neutral-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-neutral-900">{u.name}</span>
                        {currentUser?.id === u.id && (
                          <span className="px-1.5 py-0.5 bg-brand-yellow border border-black text-[9px] font-black uppercase">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-600">{u.username}</td>
                    <td className="py-3 px-4 text-xs text-neutral-600">{u.email || '-'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-800">
                      {u.phone || '0851-2201-4584'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-black uppercase border border-black ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-brand-red text-white'
                            : u.role === 'ADMIN'
                            ? 'bg-brand-yellow text-black'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-black uppercase border border-black ${
                          u.is_active ? 'bg-green-400 text-black' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 bg-brand-yellow hover:bg-yellow-400 border-2 border-black transition-transform active:scale-95"
                            title="Edit Admin"
                          >
                            <EditIcon className="w-4 h-4 text-black" />
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="p-1.5 bg-brand-red hover:bg-red-700 border-2 border-black text-white transition-transform active:scale-95"
                              title="Hapus Admin"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <h3 className="font-black text-lg uppercase text-brand-red">Hapus Akun Pengguna</h3>
            <p className="text-sm text-neutral-700 font-medium">
              Apakah Anda yakin ingin menghapus akun admin ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-neutral-200 border-2 border-black font-black uppercase text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-brand-red text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-neutral-900">
                {editingUser ? 'Edit Pengguna Admin' : 'Tambah Admin Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-neutral-100 border-2 border-transparent hover:border-black"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin2"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {editingUser ? 'Ganti Password (Kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@miejebew.id"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Role Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none"
                  >
                    <option value={1}>Aktif</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-200 border-2 border-black font-black uppercase text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000]"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
