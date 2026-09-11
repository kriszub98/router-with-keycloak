export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {/* {import.meta.env.dev && } */}
      <Outlet />
    </QueryClientProvider>
  );
}
