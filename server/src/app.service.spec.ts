import { AppService } from './app.service';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_10_MINUTES: '0 */10 * * * *' },
}));

describe('AppService', () => {
  const originalHealthCheckUrl = process.env.HEALTH_CHECK_URL;

  afterEach(() => {
    if (originalHealthCheckUrl === undefined) {
      delete process.env.HEALTH_CHECK_URL;
    } else {
      process.env.HEALTH_CHECK_URL = originalHealthCheckUrl;
    }
    jest.restoreAllMocks();
  });

  it('uses the configured health check URL', async () => {
    process.env.HEALTH_CHECK_URL = 'https://service.example.com/health';
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);

    await new AppService().handleCron();

    expect(fetchMock).toHaveBeenCalledWith('https://service.example.com/health');
  });
});
