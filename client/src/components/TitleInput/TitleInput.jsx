import React, { useState } from 'react';
import './TitleInput.css';

const TitleInput = ({title, setTitle, defaultValue}) => {
  const onChange = (e) => {
    setTitle(e.target.value);
  }
  return (
    <input defaultValue={defaultValue} value={title} onChange={onChange} className='input' type="text" placeholder="제목에 핵심 내용을 요약해보세요." />
  );
};

export default TitleInput;