export function Block({ title, text }: { title: string; text: string }) {
  return (
    <section className="block">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

export function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="block">
      <h3>{title}</h3>
      <ul className="block-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
