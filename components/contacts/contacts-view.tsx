"use client";

import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";

import {
  Star,
  Trash2,
  Search,
  Mail,
  Phone,
  Building2,
  User,
  CheckSquare,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toDateKey } from "@/lib/date";

import { Contact } from "@/types/contact";

import { createContact, updateContact, deleteContact } from "@/lib/contacts";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ContactDetail } from "@/components/contacts/contact-detail";
import { EmptyState } from "@/components/shared/empty-state";

const ITEMS_PER_SECTION = 5;

interface Props {
  initialContacts: Contact[];
}

export function ContactsView({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const query = search.toLowerCase();

      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

  const favoriteContacts = useMemo(
    () => filteredContacts.filter((c) => c.favorite),
    [filteredContacts]
  );

  const otherContacts = useMemo(
    () => filteredContacts.filter((c) => !c.favorite),
    [filteredContacts]
  );

  const displayedFavorites = showAllFavorites
    ? favoriteContacts
    : favoriteContacts.slice(0, ITEMS_PER_SECTION);

  const displayedOthers = showAllContacts
    ? otherContacts
    : otherContacts.slice(0, ITEMS_PER_SECTION);

  async function handleAddContact() {
    const optimisticContact: Contact = {
      id: uuid(),
      user_id: "",
      name: "New Contact",
      email: "",
      phone: "",
      company: "",
      role: "",
      notes: "",
      favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setContacts((prev) => [optimisticContact, ...prev]);

    try {
      const created = await createContact({
        name: "New Contact",
      });

      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === optimisticContact.id ? created : contact
        )
      );

      toast.success("Contact created");
    } catch {
      setContacts((prev) =>
        prev.filter((contact) => contact.id !== optimisticContact.id)
      );

      toast.error("Failed to create contact");
    }
  }

  async function createFollowUpTask(contact: Contact) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sign in to create tasks");
      return;
    }

    const today = toDateKey();
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: `Follow up with ${contact.name}`,
      completed: false,
      due_date: `${today}T12:00:00`,
    });

    if (error) {
      toast.error("Failed to create task");
      return;
    }

    toast.success("Follow-up task added for today");
  }

  async function handleUpdate(id: string, updates: Partial<Contact>) {
    const previousContacts = contacts;

    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? {
              ...contact,
              ...updates,
            }
          : contact
      )
    );

    try {
      await updateContact(id, updates);
    } catch {
      setContacts(previousContacts);

      toast.error("Failed to update contact");
    }
  }

  async function handleDelete(id: string) {
    const previousContacts = contacts;

    setContacts((prev) => prev.filter((contact) => contact.id !== id));

    try {
      await deleteContact(id);

      toast.success("Contact deleted");
    } catch {
      setContacts(previousContacts);

      toast.error("Failed to delete contact");
    }
  }

  // Empty state when no contacts exist at all
  if (contacts.length === 0) {
    return (
      <EmptyState
        module="contacts"
        icon={Users}
        heading="Your contacts live here"
        body="Add the people who matter to you — friends, colleagues, and collaborators."
        actionLabel="Add Contact"
        onAction={handleAddContact}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="input-app h-11 pl-10"
          />
        </div>

        <Button
          onClick={handleAddContact}
          className="btn-primary-app flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          Add Contact
        </Button>
      </div>

      {/* Empty search results */}
      {filteredContacts.length === 0 && search && (
        <div className="card-app flex h-52 items-center justify-center text-sm text-app-muted">
          No contacts match your search.
        </div>
      )}

      {/* Favorites Section */}
      {favoriteContacts.length > 0 && (
        <section aria-label="Favorite contacts">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm uppercase tracking-[0.24em] text-app-muted">
              Favorites
            </h2>
            <span className="rounded-full bg-app-elevated px-2 py-0.5 text-xs text-app-muted">
              {favoriteContacts.length}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {displayedFavorites.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={() => {
                  setSelectedContact(contact);
                  setDetailOpen(true);
                }}
                onUpdate={handleUpdate}
                onFollowUp={createFollowUpTask}
              />
            ))}
          </div>

          {favoriteContacts.length > ITEMS_PER_SECTION && (
            <button
              type="button"
              onClick={() => setShowAllFavorites(!showAllFavorites)}
              className="mt-3 flex items-center gap-1 text-sm text-app-muted transition hover:text-app"
            >
              {showAllFavorites ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {favoriteContacts.length} favorites
                </>
              )}
            </button>
          )}
        </section>
      )}

      {/* All Contacts Section */}
      {otherContacts.length > 0 && (
        <section aria-label="All contacts">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-app-muted" />
            <h2 className="text-sm uppercase tracking-[0.24em] text-app-muted">
              All Contacts
            </h2>
            <span className="rounded-full bg-app-elevated px-2 py-0.5 text-xs text-app-muted">
              {otherContacts.length}
            </span>
          </div>

          <div className="space-y-2">
            {displayedOthers.map((contact) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onSelect={() => {
                  setSelectedContact(contact);
                  setDetailOpen(true);
                }}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onFollowUp={createFollowUpTask}
              />
            ))}
          </div>

          {otherContacts.length > ITEMS_PER_SECTION && (
            <button
              type="button"
              onClick={() => setShowAllContacts(!showAllContacts)}
              className="mt-3 flex items-center gap-1 text-sm text-app-muted transition hover:text-app"
            >
              {showAllContacts ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {otherContacts.length} contacts
                </>
              )}
            </button>
          )}
        </section>
      )}

      {/* Contact Detail Sheet */}
      <ContactDetail
        contact={selectedContact}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={(id, updates) => {
          handleUpdate(id, updates);
          setSelectedContact((prev) =>
            prev && prev.id === id ? { ...prev, ...updates } : prev
          );
        }}
        onDelete={(id) => {
          handleDelete(id);
          setDetailOpen(false);
        }}
      />
    </div>
  );
}

// ─── Contact Card (card-app) for favorites grid ─────────────────────────────

function ContactCard({
  contact,
  onSelect,
  onUpdate,
  onFollowUp,
}: {
  contact: Contact;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onFollowUp: (contact: Contact) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="card-app cursor-pointer p-6 transition-all"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-elevated">
            <User className="h-5 w-5 text-app-muted" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-app">
              {contact.name}
            </p>
            <p className="truncate text-sm text-app-muted">
              {contact.role || contact.company || "No role"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFollowUp(contact);
            }}
            className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-elevated hover:text-app"
            aria-label="Add follow-up task"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(contact.id, { favorite: !contact.favorite });
            }}
            aria-label={contact.favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                contact.favorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-app-muted"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-4 space-y-2">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-app-muted">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-app-muted">
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{contact.phone}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex items-center gap-2 text-sm text-app-muted">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contact List Item (item-app) for all contacts list ─────────────────────

function ContactListItem({
  contact,
  onSelect,
  onUpdate,
  onDelete,
  onFollowUp,
}: {
  contact: Contact;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
  onFollowUp: (contact: Contact) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="item-app flex cursor-pointer items-center gap-4 p-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-elevated">
        <User className="h-4 w-4 text-app-muted" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-app">{contact.name}</p>
        <p className="truncate text-sm text-app-muted">
          {contact.role && contact.company
            ? `${contact.role} at ${contact.company}`
            : contact.role || contact.company || contact.email || ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {contact.email && (
          <span className="hidden text-xs text-app-muted md:inline">
            {contact.email}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFollowUp(contact);
          }}
          className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-elevated hover:text-app"
          aria-label="Add follow-up task"
        >
          <CheckSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(contact.id, { favorite: !contact.favorite });
          }}
          aria-label={contact.favorite ? "Remove from favorites" : "Add to favorites"}
          className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-elevated hover:text-app"
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(contact.id);
          }}
          className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          aria-label="Delete contact"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
