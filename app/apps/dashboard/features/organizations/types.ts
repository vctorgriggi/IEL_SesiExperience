export type OrganizationDetails = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo?: string | null;
};

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role: string;
  isOwner: boolean;
};
