declare module 'nocodb-sdk' {
  export const lib: {
    Filterv1?: unknown;
  };
  export namespace lib {
    type Filterv1 = {
      where?: string;
      limit?: number;
      sort?: string;
      offset?: number;
      fields?: string | string[];
    };
  }
}
