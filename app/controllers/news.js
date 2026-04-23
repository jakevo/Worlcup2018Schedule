import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const EN_FEEDS = [
    {
        source: 'FIFA',
        title: 'Official FIFA World Cup 26 news hub',
        url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/news',
        summary: 'Fixture announcements, travel information and match recaps direct from the tournament organiser.'
    },
    {
        source: 'BBC Sport',
        title: 'BBC coverage of the 2026 World Cup',
        url: 'https://www.bbc.com/sport/football/world-cup',
        summary: 'Live blogs, match reports and tactical analysis from the BBC Sport football desk.'
    },
    {
        source: 'ESPN',
        title: 'ESPN FC 2026 World Cup hub',
        url: 'https://www.espn.com/soccer/fifa-world-cup',
        summary: 'US-focused reporting, interviews and opinion covering all 48 nations.'
    },
    {
        source: 'The Guardian',
        title: 'Guardian Football World Cup coverage',
        url: 'https://www.theguardian.com/football/world-cup-football',
        summary: 'Long-form features, match ratings and the daily World Cup briefing email.'
    },
    {
        source: 'CONCACAF',
        title: 'Host confederation updates',
        url: 'https://www.concacaf.com/',
        summary: 'News from the host confederation covering Canada, Mexico and the United States.'
    }
];

const VI_FEEDS = [
    {
        source: 'FIFA (tiếng Việt)',
        title: 'Trang chính thức World Cup 26',
        url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/news',
        summary: 'Thông báo lịch thi đấu, thông tin di chuyển và tổng kết trận đấu từ ban tổ chức giải.'
    },
    {
        source: 'VnExpress Bóng đá',
        title: 'VnExpress – Chuyên mục Bóng đá quốc tế',
        url: 'https://vnexpress.net/bong-da',
        summary: 'Tin tức, bình luận và phân tích về World Cup 2026 cùng các giải đấu lớn trên thế giới.'
    },
    {
        source: 'Bongdaplus',
        title: 'Bongdaplus – Cổng tin bóng đá',
        url: 'https://bongdaplus.vn/world-cup.html',
        summary: 'Cập nhật chuyên sâu vòng loại và vòng chung kết World Cup 2026.'
    },
    {
        source: 'Thethao247',
        title: 'Thể thao 247 – World Cup 2026',
        url: 'https://thethao247.vn/world-cup-2026-c220.html',
        summary: 'Tin nhanh, phỏng vấn và phân tích chiến thuật từ đội ngũ phóng viên thể thao Việt Nam.'
    },
    {
        source: 'VFF',
        title: 'Liên đoàn Bóng đá Việt Nam',
        url: 'https://vff.org.vn/',
        summary: 'Thông tin chính thức từ Liên đoàn Bóng đá Việt Nam về các giải đấu quốc tế.'
    }
];

export default Controller.extend({
    locale: service('locale'),

    feeds: computed('locale.current', function () {
        return this.get('locale.current') === 'vi' ? VI_FEEDS : EN_FEEDS;
    })
});
