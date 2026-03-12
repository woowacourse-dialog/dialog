import { copyRichText } from './clipboard';

describe('copyRichText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigator.clipboard.write가 있으면 사용한다', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: mockWrite },
      writable: true,
      configurable: true,
    });
    // ClipboardItem은 new로 호출되므로 function 키워드 사용
    window.ClipboardItem = vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
    });

    await copyRichText('<b>html</b>', 'text');
    expect(mockWrite).toHaveBeenCalled();
  });

  it('ClipboardItem 미지원 시 document.execCommand 폴백을 사용한다', async () => {
    // ClipboardItem 없는 환경 시뮬레이션
    delete window.ClipboardItem;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    // jsdom에 execCommand가 없으므로 직접 정의
    document.execCommand = vi.fn().mockReturnValue(true);

    await copyRichText('<b>html</b>', 'text');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('복사 실패 시 에러를 throw한다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: vi.fn().mockRejectedValue(new Error('fail')) },
      writable: true,
      configurable: true,
    });
    window.ClipboardItem = vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
    });

    await expect(copyRichText('<b>html</b>', 'text')).rejects.toThrow();
  });
});
