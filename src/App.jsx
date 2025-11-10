// src/App.jsx
import React, { useState, useEffect } from 'react'
import './index.css'

const RUS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const RUS_LOWER = RUS.toLowerCase();

function caesarEncrypt(text, shift) {
  shift = ((Number(shift) || 0) % RUS.length + RUS.length) % RUS.length
  return text.split('').map(ch => {
    if (RUS.includes(ch)) return RUS[(RUS.indexOf(ch) + shift) % RUS.length]
    if (RUS_LOWER.includes(ch)) return RUS_LOWER[(RUS_LOWER.indexOf(ch) + shift) % RUS.length]
    return ch
  }).join('')
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, -shift)
}

function vigenereEncrypt(plaintext, key) {
  if (!key) return plaintext
  let ki = 0
  return plaintext.split('').map(ch => {
    const k = key[ki % key.length]
    const shift = RUS.includes(k) ? RUS.indexOf(k) : RUS_LOWER.includes(k) ? RUS_LOWER.indexOf(k) : null
    if (shift === null) return ch
    if (RUS.includes(ch)) { ki++; return RUS[(RUS.indexOf(ch) + shift) % RUS.length] }
    if (RUS_LOWER.includes(ch)) { ki++; return RUS_LOWER[(RUS_LOWER.indexOf(ch) + shift) % RUS.length] }
    return ch
  }).join('')
}

function vigenereDecrypt(ciphertext, key) {
  if (!key) return ciphertext
  let ki = 0
  return ciphertext.split('').map(ch => {
    const k = key[ki % key.length]
    const shift = RUS.includes(k) ? RUS.indexOf(k) : RUS_LOWER.includes(k) ? RUS_LOWER.indexOf(k) : null
    if (shift === null) return ch
    if (RUS.includes(ch)) { ki++; return RUS[(RUS.indexOf(ch) - shift + RUS.length) % RUS.length] }
    if (RUS_LOWER.includes(ch)) { ki++; return RUS_LOWER[(RUS_LOWER.indexOf(ch) - shift + RUS.length) % RUS.length] }
    return ch
  }).join('')
}

function generateSubstitutionMap() {
  const letters = RUS.split('')
  const shuffled = letters.slice().sort(() => Math.random() - 0.5)
  const map = {}
  for (let i = 0; i < letters.length; i++) {
    map[letters[i]] = shuffled[i]
    map[letters[i].toLowerCase()] = shuffled[i].toLowerCase()
  }
  return map
}

function substitutionEncrypt(text, map) {
  return text.split('').map(ch => map[ch] ?? ch).join('')
}

function invertMap(map) {
  const inv = {}
  for (const k in map) inv[map[k]] = k
  return inv
}

export default function CipherTrainer() {
  const [mode, setMode] = useState('encrypt')
  const [algorithm, setAlgorithm] = useState('caesar')
  const [input, setInput] = useState('Привет, мир!')
  const [shift, setShift] = useState(3)
  const [vKey, setVKey] = useState('КЛЮЧ')
  const [subMap, setSubMap] = useState(() => {
    const stored = localStorage.getItem('cipher_sub_map')
    return stored ? JSON.parse(stored) : generateSubstitutionMap()
  })
  const [output, setOutput] = useState('')

  useEffect(() => { localStorage.setItem('cipher_sub_map', JSON.stringify(subMap)) }, [subMap])



  function compute() {
    if (algorithm === 'caesar') setOutput(mode === 'encrypt' ? caesarEncrypt(input, shift) : caesarDecrypt(input, shift))
    else if (algorithm === 'vigenere') setOutput(mode === 'encrypt' ? vigenereEncrypt(input, vKey) : vigenereDecrypt(input, vKey))
    else if (algorithm === 'substitution') setOutput(mode === 'encrypt' ? substitutionEncrypt(input, subMap) : substitutionEncrypt(input, invertMap(subMap)))
  }

  function handleGenerateMap() { setSubMap(generateSubstitutionMap()) }
  function copyOutput() { navigator.clipboard.writeText(output) }

  return (
    <div className="cipher-root">
      <div className="cipher-card">
        <header className="cipher-header">
          <h1>Тренажёр шифров — русский текст</h1>
          <div className="muted">Алгоритмы: Цезарь, Виженер, Подстановка</div>
        </header>

        <section className="controls">
          <div className="row">
            <label>Режим</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="encrypt">Зашифровать</option>
              <option value="decrypt">Расшифровать</option>
            </select>
            <label>Алгоритм</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
              <option value="caesar">Цезарь (сдвиг)</option>
              <option value="vigenere">Виженер (ключ)</option>
              <option value="substitution">Подстановка</option>
            </select>
          </div>

          <div className="row">
            <label>Исходный текст</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} />
          </div>

          {algorithm === 'caesar' && (
            <div className="row small">
              <label>Сдвиг</label>
              <input type="number" value={shift} onChange={e => setShift(Number(e.target.value))} min={0} max={32} />
            </div>
          )}

          {algorithm === 'vigenere' && (
            <div className="row small">
              <label>Ключ</label>
              <input value={vKey} onChange={e => setVKey(e.target.value.replace(/[^а-яёА-ЯЁ]/g, ''))} />
            </div>
          )}

          {algorithm === 'substitution' && (
            <div className="row small">
              <label>Карта подстановки</label>
              <div className="sub-controls">
                <button onClick={handleGenerateMap}>Сгенерировать</button>
                <button onClick={() => { localStorage.removeItem('cipher_sub_map'); handleGenerateMap(); }}>Сбросить</button>
              </div>
            </div>
          )}

          <div className="row actions">
            <button onClick={compute} className="primary">Вычислить</button>
            <button onClick={() => { setInput(''); setOutput(''); }}>Очистить</button>
          </div>
        </section>

        <section className="result">
          <label>Результат</label>
          <textarea readOnly value={output} rows={6} />
          <button onClick={copyOutput}>Копировать</button>
        </section>

        <section className="reverse">
          <h3>Обратно</h3>
          <textarea readOnly value={(() => {
            const source = output || input
            if (!source) return ''
            if (algorithm === 'caesar') return caesarDecrypt(source, shift)
            if (algorithm === 'vigenere') return vigenereDecrypt(source, vKey)
            if (algorithm === 'substitution') return substitutionEncrypt(source, invertMap(subMap))
            return ''
          })()} rows={4} />
        </section>

        <footer className="cipher-footer">Для обучения — не использовать для реальной защиты</footer>
      </div>
    </div>
  )
}