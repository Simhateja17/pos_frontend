'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FolderTree, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useT } from '@/lib/i18n/i18n'

type Category = {
  id: string
  name: string
  sortOrder: number
  productCount: number
  createdAt: string
}

export function CategoriesView() {
  const t = useT()
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.GET('/categories', { headers: await authHeaders() })
    setLoading(false)
    if (requestError || !data) {
      setError(t('inventory.errors.categoryLoad'))
      return
    }
    setCategories(data as Category[])
    // t is intentionally omitted: changing locale must not refetch categories.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName('')
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setName(category.name)
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setFormError(t('inventory.errors.categoryName'))
      return
    }

    setSaving(true)
    setFormError(null)
    const headers = await authHeaders()

    const { error: requestError } = editing
      ? await apiClient.PATCH('/categories/{categoryId}', {
          params: { path: { categoryId: editing.id } },
          body: { name: name.trim() },
          headers,
        })
      : await apiClient.POST('/categories', { body: { name: name.trim() }, headers })

    setSaving(false)

    if (requestError) {
      setFormError((requestError as { error?: string }).error ?? t('inventory.errors.categorySave'))
      return
    }

    setFormOpen(false)
    await load()
  }

  async function remove(category: Category) {
    const { error: requestError } = await apiClient.DELETE('/categories/{categoryId}', {
      params: { path: { categoryId: category.id } },
      headers: await authHeaders(),
    })
    if (requestError) {
      setError(t('inventory.errors.categoryDelete'))
      return
    }
    await load()
  }

  // The full list is already in memory, so the search filters it here rather
  // than round-tripping. Name is the only field an owner would type.
  const term = search.trim().toLowerCase()
  const visible = (categories ?? []).filter((c) =>
    term ? c.name.toLowerCase().includes(term) : true,
  )

  return (
    <>
      <PageHead
        title={t('inventory.categories.title')}
        sub={t('inventory.categories.subtitle')}
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> {t('inventory.categories.addCategory')}
          </button>
        }
      />

      <Card>
        <CardHead
          title={t('inventory.categories.title')}
          sub={categories
            ? `${term ? visible.length : categories.length} ${(term ? visible.length : categories.length) === 1 ? t('inventory.categories.categoryOne') : t('inventory.categories.categoryMany')}`
            : t('inventory.categories.loading')}
          right={
            categories && categories.length > 0 ? (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder={t('inventory.categories.searchPlaceholder')}
                ariaLabel={t('inventory.categories.searchLabel')}
                width={240}
              />
            ) : undefined
          }
        />

        {loading && <LoadingState label={t('inventory.categories.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && categories?.length === 0 && (
          <EmptyState
            icon={<FolderTree size={24} strokeWidth={1.8} />}
            title={t('inventory.categories.emptyTitle')}
            body={t('inventory.categories.emptyBody')}
            action={
              <button className="btn btn-pri" onClick={openCreate}>
                <Plus size={15} /> {t('inventory.categories.addCategory')}
              </button>
            }
          />
        )}

        {!loading && !error && categories && categories.length > 0 && visible.length === 0 && (
          <EmptyState
            title={t('inventory.categories.noMatchTitle')}
            body={t('inventory.categories.noMatchBody')}
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={[t('inventory.categories.cols.category'), t('inventory.categories.cols.products'), t('inventory.categories.cols.actions')]}
            minWidth={560}
          >
            {visible.map((category) => (
              <tr key={category.id}>
                <td className="t-strong">{category.name}</td>
                <td className="num">{category.productCount}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => openEdit(category)}>
                      {t('inventory.categories.rename')}
                    </button>
                    <button className="btn btn-sm" onClick={() => void remove(category)}>
                      {t('inventory.categories.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {formOpen && (
        <Modal
          title={editing ? t('inventory.categories.editTitle', { name: editing.name }) : t('inventory.categories.newTitle')}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="category-form" disabled={saving}>
                {saving ? t('inventory.categories.saving') : editing ? t('inventory.categories.saveChanges') : t('inventory.categories.addCategory')}
              </button>
            </>
          }
        >
          <form id="category-form" onSubmit={handleSubmit}>
            {formError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {formError}
              </div>
            )}
            <Fld id="category-name" label={t('inventory.categories.categoryName')}>
              <input
                id="category-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('inventory.categories.categoryNamePlaceholder')}
              />
            </Fld>
            {editing && editing.productCount > 0 && (
              <p className="t-sub" style={{ fontSize: 12 }}>
                {t('inventory.categories.renameProducts', { count: editing.productCount })}
              </p>
            )}
          </form>
        </Modal>
      )}
    </>
  )
}
