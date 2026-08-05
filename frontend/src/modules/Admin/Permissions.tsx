import { useEffect, useMemo, useState } from 'react';
import { Save, Shield } from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { getApiBaseUrl } from '../../lib/apiBase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCrudToast } from '../../hooks/useCrudToast';
import {
  MENU_TREE,
  collectSubtreeIds,
  type MenuTreeNode,
} from '../../constants/menuTree';
import { isFullAccessRole } from '../../lib/permissions';

type RoleRecord = {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  permissions?: string[];
};

function roleDocId(role: RoleRecord): string {
  return String(role.id || role._id || '').trim();
}

export function Permissions() {
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const selectedRole = useMemo(
    () => roles.find((r) => roleDocId(r) === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = ((await genericApi.list('roles')) as RoleRecord[]) || [];
      const normalized = data.map((r) => ({ ...r, id: roleDocId(r) })).filter((r) => r.id);
      setRoles(normalized);
      if (!selectedRoleId && normalized.length) {
        setSelectedRoleId(normalized[0].id);
        setChecked(new Set(normalized[0].permissions || ['dashboard']));
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    if (isFullAccessRole(selectedRole.name)) {
      const all = new Set<string>();
      const walk = (nodes: MenuTreeNode[]) => {
        for (const n of nodes) {
          all.add(n.id);
          if (n.children) walk(n.children);
        }
      };
      walk(MENU_TREE);
      setChecked(all);
      return;
    }
    setChecked(new Set(selectedRole.permissions || ['dashboard']));
  }, [selectedRole]);

  const toggleNode = (node: MenuTreeNode, enable: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const ids = collectSubtreeIds(node);
      if (enable) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      // Always keep dashboard if emptying? User can uncheck - but then no access. Keep optional.
      return next;
    });
  };

  const isChecked = (id: string) => checked.has(id);

  const isIndeterminate = (node: MenuTreeNode): boolean => {
    if (!node.children?.length) return false;
    const ids = collectSubtreeIds(node).filter((id) => id !== node.id);
    const selected = ids.filter((id) => checked.has(id)).length;
    return selected > 0 && selected < ids.length;
  };

  const selectAll = () => {
    const all = new Set<string>();
    const walk = (nodes: MenuTreeNode[]) => {
      for (const n of nodes) {
        all.add(n.id);
        if (n.children) walk(n.children);
      }
    };
    walk(MENU_TREE);
    setChecked(all);
  };

  const clearAll = () => setChecked(new Set(['dashboard']));

  const handleSave = async () => {
    if (!selectedRole) return;
    const docId = roleDocId(selectedRole);
    if (!docId) {
      alert(t('permissions.invalidRoleId') || 'Identifiant du rôle invalide');
      return;
    }
    if (isFullAccessRole(selectedRole.name)) {
      alert(t('permissions.fullAccessLocked'));
      return;
    }
    setSaving(true);
    try {
      const permissions = Array.from(checked);
      await genericApi.update('roles', docId, {
        name: selectedRole.name,
        description: selectedRole.description || '',
        permissions,
      });

      const syncRes = await fetch(`${getApiBaseUrl()}/api/users/sync-role-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole.name, permissions }),
      });
      if (!syncRes.ok) {
        const body = await syncRes.json().catch(() => ({}));
        throw new Error(body.message || 'Erreur synchronisation utilisateurs');
      }

      setRoles((prev) =>
        prev.map((r) => (roleDocId(r) === docId ? { ...r, id: docId, permissions } : r))
      );
      crudToast.onSaved(true);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  const renderNode = (node: MenuTreeNode, depth = 0) => {
    const childIds = node.children || [];
    const indeterminate = isIndeterminate(node);
    return (
      <div key={node.id} className={depth === 0 ? 'border-b border-gray-100 py-2' : 'py-1'}>
        <label
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-800"
          style={{ paddingLeft: depth * 16 }}
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#0F3C66] focus:ring-[#0F3C66]"
            checked={isChecked(node.id)}
            ref={(el) => {
              if (el) el.indeterminate = indeterminate;
            }}
            disabled={isFullAccessRole(selectedRole?.name)}
            onChange={(e) => toggleNode(node, e.target.checked)}
          />
          <span className={depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : ''}>
            {t(`menu.${node.id}`)}
          </span>
        </label>
        {childIds.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{t('permissions.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('permissions.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!selectedRole || saving || isFullAccessRole(selectedRole?.name)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#152a44] disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-[#0F3C66]">
            <Shield size={18} />
            <h2 className="font-semibold">{t('permissions.selectRole')}</h2>
          </div>
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500">{t('permissions.noRoles')}</p>
          ) : (
            <div className="space-y-1">
              {roles.map((role) => {
                const id = roleDocId(role);
                return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedRoleId(id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selectedRoleId === id
                      ? 'bg-[#0F3C66] text-white'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  {role.description ? (
                    <div
                      className={`mt-0.5 text-xs ${
                        selectedRoleId === id ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {role.description}
                    </div>
                  ) : null}
                </button>
              );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-800">
              {selectedRole
                ? `${t('permissions.menusFor')} ${selectedRole.name}`
                : t('permissions.selectRole')}
            </h2>
            {selectedRole && !isFullAccessRole(selectedRole.name) && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                >
                  {t('permissions.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                >
                  {t('permissions.clear')}
                </button>
              </div>
            )}
          </div>

          {isFullAccessRole(selectedRole?.name) && (
            <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {t('permissions.fullAccessLocked')}
            </p>
          )}

          {!selectedRole ? (
            <p className="py-10 text-center text-gray-500">{t('permissions.selectRole')}</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {MENU_TREE.map((node) => renderNode(node))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
