export type AccountDetails = {
  name: string;
  phone: string | null;
  image: string | null;
};

export type AccountEmails = {
  marketing: {
    enabledNewsletter: boolean;
    enabledProductUpdates: boolean;
  };
  transactional: {
    enabledInboxNotifications: boolean;
    enabledWeeklySummary: boolean;
  };
};
