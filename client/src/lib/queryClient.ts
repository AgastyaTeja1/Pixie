import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // Check if the response is ok but don't throw yet - let the caller handle the response
    if (!res.ok) {
      console.warn(`API Response not OK: ${res.status} ${res.statusText}`, res);
    } else {
      console.log(`API Response OK: ${res.status}`, res);
    }
    
    return res;
  } catch (error) {
    console.error(`API Request error: ${error}`);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

interface QueryFnOptions {
  on401: UnauthorizedBehavior;
}

export function getQueryFn<TData>(options: QueryFnOptions): QueryFunction<TData> {
  const { on401: unauthorizedBehavior } = options;
  
  return async ({ queryKey }) => {
    console.log(`Query Request: ${queryKey[0]}`);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`Query Response: ${res.status}`, res);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as unknown as TData;
      }

      if (!res.ok) {
        const text = await res.text();
        console.error(`Query error ${res.status}: ${text || res.statusText}`);
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      // Handle empty responses
      if (res.headers.get('Content-Length') === '0') {
        return {} as unknown as TData;
      }
      
      try {
        // Attempt to parse JSON
        const data = await res.json();
        return data as TData;
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error(`Query Request error:`, error);
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
