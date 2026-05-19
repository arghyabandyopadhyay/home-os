"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Pencil,
  Trash2,
  User,
} from "lucide-react";

import { Contact } from "@/types/contact";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { CallButton } from "@/components/contacts/call-button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactDetailProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
}

export function ContactDetail({
  contact,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ContactDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<Contact>>({});
  const isMobile = useIsMobile();

  if (!contact) return null;

  function startEditing() {
    setEditValues({
      name: contact!.name,
      email: contact!.email || "",
      phone: contact!.phone || "",
      company: contact!.company || "",
      role: contact!.role || "",
      notes: contact!.notes || "",
    });
    setIsEditing(true);
  }

  function saveEdits() {
    if (!contact) return;
    onUpdate(contact.id, editValues);
    setIsEditing(false);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditValues({});
  }

  function handleDelete() {
    if (!contact) return;
    onDelete(contact.id);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-app">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <User className="h-5 w-5 text-app/70" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-app">
                {contact.name}
              </SheetTitle>
              <SheetDescription className="text-sm text-app-muted">
                {contact.role || contact.company || "Contact details"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-4">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Name
                </label>
                <Input
                  value={editValues.name || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-app"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Email
                </label>
                <Input
                  value={editValues.email || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="input-app"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Phone
                </label>
                <Input
                  value={editValues.phone || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="input-app"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Company
                </label>
                <Input
                  value={editValues.company || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="input-app"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Role
                </label>
                <Input
                  value={editValues.role || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="input-app"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-app-muted">
                  Notes
                </label>
                <Textarea
                  value={editValues.notes || ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                  className="resize-none rounded-xl border-app bg-white/5 text-app placeholder:text-app-muted focus-visible:ring-0"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={saveEdits}
                  className="btn-primary-app flex-1 rounded-xl"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelEditing}
                  className="flex-1 rounded-xl text-app-muted hover:text-app"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {/* Email */}
              {contact.email && (
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 text-app-muted" />
                  <span className="text-sm text-app">{contact.email}</span>
                </div>
              )}

              {/* Phone */}
              {contact.phone && (
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <Phone className="h-4 w-4 text-app-muted" />
                  <span className="text-sm text-app flex-1">{contact.phone}</span>
                  {isMobile && !isEditing && (
                    <CallButton phone={contact.phone} contactName={contact.name} />
                  )}
                </div>
              )}

              {/* Company */}
              {contact.company && (
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <Building2 className="h-4 w-4 text-app-muted" />
                  <span className="text-sm text-app">{contact.company}</span>
                </div>
              )}

              {/* Role */}
              {contact.role && (
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <Briefcase className="h-4 w-4 text-app-muted" />
                  <span className="text-sm text-app">{contact.role}</span>
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-app-muted">Notes</p>
                  <div className="rounded-xl bg-white/5 px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm text-app">
                      {contact.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* No info message */}
              {!contact.email &&
                !contact.phone &&
                !contact.company &&
                !contact.role &&
                !contact.notes && (
                  <p className="text-sm text-app-muted">
                    No additional details for this contact.
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="flex gap-3 border-t border-app p-4">
            <Button
              variant="ghost"
              onClick={startEditing}
              className="flex-1 rounded-xl text-app hover:bg-app-elevated"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete contact</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {contact.name}? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
