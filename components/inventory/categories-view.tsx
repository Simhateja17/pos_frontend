'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FolderTree, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

type Category = {
  id: string
  name: string
  sortOrder: number
  productCount: number
  createdAt: string
}

export function CategoriesView() {
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
      setError('We couldn’t load your categories. Check your connection and try again.')
      return
    }
    setCategories(data as Category[])
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
      setFormError('Enter a category name.')
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
      setFormError((requestError as { error?: string }).error ?? 'That category could not be saved.')
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
      setError('That category could not be deleted.')
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
        title="Categories"
        sub="How your products are grouped in reports and on the till"
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> Add category
          </button>
        }
      />

      <Card>
        <CardHead
          title="Your categories"
          sub={categories ? (term ? `${visible.length} shown` : `${categories.length} in use`) : 'Loading…'}
          right={
            categories && categories.length > 0 ? (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search categories…"
                ariaLabel="Search categories"
                width={240}
              />
            ) : undefined
          }
        />

        {loading && <LoadingState label="Loading categories" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && categories?.length === 0 && (
          <EmptyState
            icon={<FolderTree size={24} strokeWidth={1.8} />}
            title="No categories yet"
            body="Categories group your products in reports. You can also create one while adding a product."
            action={
              <button className="btn btn-pri" onClick={openCreate}>
                <Plus size={15} /> Add category
              </button>
            }
          />
        )}

        {!loading && !error && categories && categories.length > 0 && visible.length === 0 && (
          <EmptyState
            title="No categories match this search"
            body="Check the spelling, or clear the search to see every category."
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={['Category', 'Products', '']}
            minWidth={560}
          >
            {visible.map((category) => (
              <tr key={category.id}>
                <td className="t-strong">{category.name}</td>
                <td className="num">{category.productCount}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => openEdit(category)}>
                      Rename
                    </button>
                    <button className="btn btn-sm" onClick={() => void remove(category)}>
                      Delete
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
          title={editing ? `Rename ${editing.name}` : 'Add category'}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="category-form" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}
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
            <Fld id="category-name" label="Category name">
              <input
                id="category-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dairy"
              />
            </Fld>
            {editing && editing.productCount > 0 && (
              <p className="t-sub" style={{ fontSize: 12 }}>
                Renaming updates all {editing.productCount} products in this category at once.
              </p>
            )}
          </form>
        </Modal>
      )}
    </>
  )
}
