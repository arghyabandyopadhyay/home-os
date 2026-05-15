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
  Briefcase,
  CheckSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toDateKey } from "@/lib/date";

import { Contact } from "@/types/contact";

import { createContact, updateContact, deleteContact } from "@/lib/contacts";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  initialContacts: Contact[];
}

export function ContactsView({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const query = search.toLowerCase();

      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

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
          contact.id === optimisticContact.id ? created : contact,
        ),
      );

      toast.success("Contact created");
    } catch {
      setContacts((prev) =>
        prev.filter((contact) => contact.id !== optimisticContact.id),
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
          : contact,
      ),
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 text-app">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight text-app">
            Contacts
          </h1>

          <p className="text-sm text-app-muted">
            People, relationships, and context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="
                h-11
                rounded-xl
                border-app
                bg-white/5
                pl-10
                text-app
                placeholder:text-app-muted
                focus-visible:ring-0
              "
            />
          </div>

          <Button
            onClick={handleAddContact}
            className="
              h-11
              rounded-xl
              bg-white
              px-5
              text-black
              hover:bg-zinc-200
            "
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-app bg-app-surface/40 text-sm text-app-muted">
          No contacts found.
        </div>
      )}

      {/* Contacts Grid */}
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <Card
            key={contact.id}
            className="
              rounded-3xl
              border
              border-app
              bg-app-surface/70
              shadow-2xl
              backdrop-blur-xl
              transition-all
              hover:border-white/20
              hover:bg-app-elevated
            "
          >
            <CardContent className="space-y-6 p-6">
              {/* Top Section */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <User className="h-6 w-6 text-app/70" />
                  </div>

                  <div className="space-y-1">
                    <Input
                      value={contact.name}
                      onChange={(e) =>
                        handleUpdate(contact.id, {
                          name: e.target.value,
                        })
                      }
                      className="
                        h-auto
                        border-none
                        bg-transparent
                        p-0
                        text-xl
                        font-semibold
                        text-app
                        shadow-none
                        placeholder:text-app-muted
                        focus-visible:ring-0
                      "
                    />

                    <p className="text-sm text-app-muted">
                      {contact.role || "No role"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => createFollowUpTask(contact)}
                    className="rounded-lg border border-app p-2 text-app-muted transition hover:border-white/20 hover:text-app"
                    title="Add follow-up task for today"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(contact.id, {
                        favorite: !contact.favorite,
                      })
                    }
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        contact.favorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-app-muted"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Info Fields */}
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <Mail className="h-4 w-4 text-app-muted" />

                  <Input
                    value={contact.email || ""}
                    onChange={(e) =>
                      handleUpdate(contact.id, {
                        email: e.target.value,
                      })
                    }
                    placeholder="Email"
                    className="
                      border-none
                      bg-transparent
                      p-0
                      text-sm
                      text-app
                      shadow-none
                      placeholder:text-app-muted
                      focus-visible:ring-0
                    "
                  />
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <Phone className="h-4 w-4 text-app-muted" />

                  <Input
                    value={contact.phone || ""}
                    onChange={(e) =>
                      handleUpdate(contact.id, {
                        phone: e.target.value,
                      })
                    }
                    placeholder="Phone"
                    className="
                      border-none
                      bg-transparent
                      p-0
                      text-sm
                      text-app
                      shadow-none
                      placeholder:text-app-muted
                      focus-visible:ring-0
                    "
                  />
                </div>

                {/* Company */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <Building2 className="h-4 w-4 text-app-muted" />

                  <Input
                    value={contact.company || ""}
                    onChange={(e) =>
                      handleUpdate(contact.id, {
                        company: e.target.value,
                      })
                    }
                    placeholder="Company"
                    className="
                      border-none
                      bg-transparent
                      p-0
                      text-sm
                      text-app
                      shadow-none
                      placeholder:text-app-muted
                      focus-visible:ring-0
                    "
                  />
                </div>

                {/* Role */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <Briefcase className="h-4 w-4 text-app-muted" />

                  <Input
                    value={contact.role || ""}
                    onChange={(e) =>
                      handleUpdate(contact.id, {
                        role: e.target.value,
                      })
                    }
                    placeholder="Role"
                    className="
                      border-none
                      bg-transparent
                      p-0
                      text-sm
                      text-app
                      shadow-none
                      placeholder:text-app-muted
                      focus-visible:ring-0
                    "
                  />
                </div>
              </div>

              {/* Notes */}
              <Textarea
                value={contact.notes || ""}
                onChange={(e) =>
                  handleUpdate(contact.id, {
                    notes: e.target.value,
                  })
                }
                placeholder="Notes..."
                rows={4}
                className="
                  resize-none
                  rounded-2xl
                  border-app
                  bg-white/5
                  text-app
                  placeholder:text-app-muted
                  focus-visible:ring-0
                "
              />

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                className="
                  w-full
                  rounded-xl
                  text-red-400
                  hover:bg-red-500/10
                  hover:text-red-300
                "
                onClick={() => handleDelete(contact.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
