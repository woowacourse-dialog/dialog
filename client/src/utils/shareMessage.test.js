import { generateShareText, generateShareHtml } from './shareMessage';

describe('generateShareText', () => {
  it('트랙 이모지와 제목을 포함한 텍스트를 생성한다', () => {
    const result = generateShareText({
      track: '프론트엔드',
      title: '테스트 제목',
      content: '내용',
      link: 'https://example.com/discussion/1',
    });
    expect(result).toContain('[🎨 프론트엔드]');
    expect(result).toContain('테스트 제목');
    expect(result).toContain('https://example.com/discussion/1');
  });

  it('내용이 100자 초과 시 truncate 한다', () => {
    const longContent = 'a'.repeat(150);
    const result = generateShareText({
      track: '백엔드',
      title: '제목',
      content: longContent,
      link: 'https://example.com',
    });
    expect(result).toContain('...');
    expect(result).not.toContain('a'.repeat(150));
  });

  it('내용이 빈 문자열이어도 정상 동작한다', () => {
    const result = generateShareText({
      track: '백엔드',
      title: '제목',
      content: '',
      link: 'https://example.com',
    });
    expect(result).toContain('제목');
  });

  it('알 수 없는 트랙은 기본 이모지(💬)를 사용한다', () => {
    const result = generateShareText({
      track: '알수없는트랙',
      title: '제목',
      content: '',
      link: 'https://example.com',
    });
    expect(result).toContain('💬');
  });
});

describe('generateShareHtml', () => {
  it('HTML 형식으로 공유 메시지를 생성한다', () => {
    const result = generateShareHtml({
      track: '백엔드',
      title: '테스트',
      content: 'test',
      link: 'https://example.com',
    });
    expect(result).toContain('<strong>');
    expect(result).toContain('<a href=');
  });

  it('XSS를 방지한다 (HTML 이스케이프)', () => {
    const result = generateShareHtml({
      track: '백엔드',
      title: '<script>alert("xss")</script>',
      content: 'test',
      link: 'https://example.com',
    });
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('링크를 <a> 태그로 감싼다', () => {
    const result = generateShareHtml({
      track: '공통',
      title: '제목',
      content: '',
      link: 'https://dialog.com/discussion/42',
    });
    expect(result).toContain('href="https://dialog.com/discussion/42"');
  });
});
