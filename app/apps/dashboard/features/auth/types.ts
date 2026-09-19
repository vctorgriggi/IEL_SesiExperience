export type PageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export type AuthPageProps = {
  searchParams: PageSearchParams;
};
