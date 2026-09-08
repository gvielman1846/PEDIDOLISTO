interface Props {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ categories, active, onChange }: Props) {
  return (
    <nav className="category-nav" aria-label="Categorías del menú">
      <div className="category-nav__scroll">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-pill ${cat === active ? 'category-pill--active' : ''}`}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
