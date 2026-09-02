import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type SearchableFilterOption = {
  label: string;
  value: string;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function SearchableFilter({
  allLabel,
  ariaLabel,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  options: readonly SearchableFilterOption[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selectedLabel =
    value === 'all'
      ? allLabel
      : (options.find((option) => option.value === value)?.label ?? allLabel);
  const filteredOptions = useMemo(() => {
    const term = normalize(search.trim());
    return term
      ? options.filter((option) => normalize(option.label).includes(term))
      : options;
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function select(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setSearch('');
  }

  return (
    <div
      className="searchable-filter"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          setSearch('');
        }
      }}
      ref={rootRef}
    >
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`searchable-filter-trigger${value !== 'all' ? ' active' : ''}`}
        onClick={() =>
          setOpen((current) => {
            if (current) setSearch('');
            return !current;
          })
        }
        type="button"
      >
        <span>{selectedLabel}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>
      {open ? (
        <div className="searchable-filter-popover">
          <div className="searchable-filter-search">
            <Search aria-hidden="true" size={15} />
            <input
              aria-label={`Pesquisar em ${ariaLabel.toLocaleLowerCase('pt-BR')}`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar…"
              ref={inputRef}
              value={search}
            />
            {search ? (
              <button
                aria-label="Limpar pesquisa"
                onClick={() => setSearch('')}
                type="button"
              >
                <X aria-hidden="true" size={14} />
              </button>
            ) : null}
          </div>
          <div
            className="searchable-filter-options"
            id={listboxId}
            role="listbox"
          >
            <button
              aria-selected={value === 'all'}
              className="searchable-filter-option"
              onClick={() => select('all')}
              role="option"
              type="button"
            >
              <span>{allLabel}</span>
              {value === 'all' ? <Check aria-hidden="true" size={15} /> : null}
            </button>
            {filteredOptions.map((option) => (
              <button
                aria-selected={value === option.value}
                className="searchable-filter-option"
                key={option.value}
                onClick={() => select(option.value)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {value === option.value ? (
                  <Check aria-hidden="true" size={15} />
                ) : null}
              </button>
            ))}
            {filteredOptions.length === 0 ? (
              <span className="searchable-filter-empty">
                Nenhuma opção encontrada.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
