/**
 * GoRentals Cloud-Free Mock
 * 
 * We have removed the '@supabase/supabase-js' dependency to completely detach 
 * from cloud services. This mock allows the application to function without 
 * throwing errors by mimicking the Supabase Storage and Auth API shapes.
 */

export const supabase = {
  storage: {
    from: (bucket: string) => ({
      /**
       * Mocks the upload process.
       * Always returns an error explaining that cloud uploads are detached.
       */
      upload: async () => ({ 
        data: null, 
        error: new Error('[GoRentals] Cloud connection detached. Local storage only.') 
      }),
      
      /**
       * Mocks retrieving a public URL.
       * Returns a placeholder based on the path.
       */
      getPublicUrl: (path: string) => ({ 
        data: { publicUrl: path.startsWith('http') ? path : `/placeholder-image.jpg` } 
      }),

      /**
       * Mocks the removal process.
       */
      remove: async () => ({ error: null }),
    })
  },
  
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ 
      data: { subscription: { unsubscribe: () => {} } } 
    }),
  }
} as any;
