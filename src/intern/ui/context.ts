import { emptyFilters } from "../core/filters.ts";
import type { FacetKey, FilterContext, PostingFilters } from "../core/filters.ts";
import type { Contact, Posting, Snapshot } from "../core/types.ts";

export const VIEWS = ["overview", "postings", "board", "contacts"] as const;
export type View = (typeof VIEWS)[number];

export interface ContactFilters {
  q: string;
  company: string;
  relation: string;
  status: string;
  type: string;
  linkedOnly: boolean;
}

export const emptyContactFilters = (): ContactFilters => ({ q: "", company: "", relation: "", status: "", type: "", linkedOnly: false });

export interface UiState {
  view: View;
  filters: PostingFilters;
  contactFilters: ContactFilters;
  open: { kind: "posting" | "contact"; id: string } | null;
  editingFacts: boolean;
  openFacet: FacetKey | null;
}

export const initialState = (): UiState => ({
  view: "overview",
  filters: emptyFilters(),
  contactFilters: emptyContactFilters(),
  open: null,
  editingFacts: false,
  openFacet: null
});

// Lookups shared by every view, rebuilt once per render.
export interface ViewContext {
  snapshot: Snapshot;
  state: UiState;
  today: string;
  allPostings: Posting[];
  postings: Posting[];
  postingsById: Map<string, Posting>;
  contactsById: Map<string, Contact>;
  postingsByContact: Map<string, Posting[]>;
  filterCtx: FilterContext;
}

export const buildContext = (snapshot: Snapshot, state: UiState, today: string): ViewContext => {
  const allPostings = snapshot.postings.postings;
  const contactsById = new Map(snapshot.contacts.contacts.map((contact) => [contact.id, contact]));
  const postingsByContact = new Map<string, Posting[]>();
  for (const posting of allPostings) {
    for (const id of posting.contactIds) postingsByContact.set(id, [...(postingsByContact.get(id) || []), posting]);
  }
  return {
    snapshot,
    state,
    today,
    allPostings,
    postings: allPostings.filter((posting) => !posting.archived),
    postingsById: new Map(allPostings.map((posting) => [posting.id, posting])),
    contactsById,
    postingsByContact,
    filterCtx: { progress: snapshot.progress, contactsById, today, focusOrder: snapshot.postings.taxonomy.focusOrder }
  };
};
