'use client';

import {useId, useState} from 'react';
import type {Locale} from '@/lib/i18n';
import styles from './FitComparison.module.css';

type Fit = {label: string; value: number; text: string};

export function ErositaPlot({rows, locale}: {rows: Fit[]; locale: Locale}) {
  const group = useId();
  const [selected, setSelected] = useState(0);
  const current = rows[selected]!;
  const max = Math.ceil(Math.max(...rows.map(row => row.value)));
  return (
    <div>
      <fieldset className={styles.options}>
        <legend>{locale === 'pt' ? 'Intervalos de redshift no ajuste' : 'Redshift bins in the fit'}</legend>
        {rows.map((row, index) => (
          <label key={row.label}>
            <input type="radio" name={group} checked={index === selected} onChange={() => setSelected(index)} />
            <span>{row.label}</span>
          </label>
        ))}
      </fieldset>
      <output className={styles.readout} aria-label={locale === 'pt' ? 'Significância nominal selecionada' : 'Selected nominal significance'}>{current.text}</output>
      <div aria-hidden="true">
        <div className={styles.track}><div className={styles.bar} style={{width: `${100 * current.value / max}%`}} /></div>
        <div className={styles.ticks}>{Array.from({length: max + 1}, (_, tick) => <span key={tick}>{tick} σ</span>)}</div>
      </div>
    </div>
  );
}
