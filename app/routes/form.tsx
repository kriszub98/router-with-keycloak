type User = {
  id: number;
  name: string;
  email: string;
};

export function UserForm() {
  const { data, loading, error } = useFetch<User>("/api/user/1");
  const [form, setForm] = useState<User | null>(null);
  const [dirty, setDirty] = useState(false);

  // jednorazowa inicjalizacja formularza po załadowaniu danych
  useEffect(() => {
    if (data && !dirty) setForm(data);
  }, [data, dirty]);

  if (loading) return <div>Ładowanie…</div>;
  if (error) return <div>Błąd: {error}</div>;
  if (!form) return null;

  const onChange = <K extends keyof User>(key: K, value: User[K]) => {
    setDirty(true);
    setForm((prev) => (prev ? ({ ...prev, [key]: value } as User) : prev));
  };

  const save = async () => {
    // wyślij PUT/PATCH z form
    const res = await fetch(`/api/user/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error("Save failed");
    const updated = (await res.json()) as User;
    setForm(updated);
    setDirty(false);
    // opcjonalnie: refetch() jeśli dodasz go do useFetch
  };

  const resetToServer = () => {
    if (data) {
      setForm(data);
      setDirty(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label>
        Imię:
        <input
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </label>
      <label>
        Email:
        <input
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>

      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={!dirty}>
          Zapisz
        </button>
        <button type="button" onClick={resetToServer} disabled={!dirty}>
          Reset
        </button>
      </div>
    </form>
  );
}
