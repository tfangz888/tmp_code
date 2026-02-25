// char day[9]; char time[9];
// day存的日期为类似  20260225的字符串，time存的是类似 17:05:23的时间。miliseconds 为 int。
// 如何把这三者转换为chrono的时间，这样可以计算时间差，注意要性能高

#include <iostream>
#include <chrono>
#include <ctime>
#include <cstdint>
#include <cstdio>

static inline int d(char c) { return c - '0'; }

typedef std::chrono::time_point<std::chrono::system_clock, std::chrono::milliseconds> tp_ms;

// day: "YYYYMMDD"
// time: "HH:MM:SS"
// millis: 0~999
static inline tp_ms parse_datetime_ms(const char day[9], const char time[9], int millis)
{
    const int y  = d(day[0])*1000 + d(day[1])*100 + d(day[2])*10 + d(day[3]);
    const int mo = d(day[4])*10 + d(day[5]);
    const int da = d(day[6])*10 + d(day[7]);

    const int hh = d(time[0])*10 + d(time[1]);
    const int mm = d(time[3])*10 + d(time[4]);
    const int ss = d(time[6])*10 + d(time[7]);

    if ((unsigned)millis > 999u) millis = 0;

    std::tm tmv;
    tmv.tm_year = y - 1900;
    tmv.tm_mon  = mo - 1;
    tmv.tm_mday = da;
    tmv.tm_hour = hh;
    tmv.tm_min  = mm;
    tmv.tm_sec  = ss;
    tmv.tm_isdst = -1;

    std::time_t tt = std::mktime(&tmv);
    tp_ms tp = std::chrono::time_point_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::from_time_t(tt)
    );

    return tp + std::chrono::milliseconds(millis);
}

// 绝对毫秒差
static inline long long diff_millis(const tp_ms& a, const tp_ms& b)
{
    long long diff = (b - a).count();
    return diff >= 0 ? diff : -diff;
}

static inline void print_tp(FILE* out, tp_ms tp)
{
    std::time_t tt = std::chrono::system_clock::to_time_t(
        std::chrono::time_point_cast<std::chrono::seconds>(tp)
    );
    std::tm* lt = std::localtime(&tt);

    long long ms = (tp.time_since_epoch().count() % 1000 + 1000) % 1000;

    std::fprintf(out, "%04d-%02d-%02d %02d:%02d:%02d.%03lld",
                 lt->tm_year + 1900, lt->tm_mon + 1, lt->tm_mday,
                 lt->tm_hour, lt->tm_min, lt->tm_sec, ms);
}

// 当前时间戳（毫秒精度）
tp_ms now_tp = std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::system_clock::now());
    
    
int main()
{
    char day[9] = "20260225";
    char tim[9] = "17:05:23";
    int ms = 123;

    tp_ms data_tp = parse_datetime_ms(day, tim, ms);

    long long delta_ms = diff_millis(data_tp, now_tp);

    // 1小时 = 3600000ms
    const long long ONE_HOUR_MS = 60LL * 60LL * 1000LL;

    if (delta_ms > ONE_HOUR_MS) {
        std::cerr << "ERROR: timestamp looks invalid (delta "
                  << delta_ms << " ms > 1 hour). data=";
        print_tp(stderr, data_tp);
        std::cerr << " now=";
        print_tp(stderr, now_tp);
        std::cerr << "\n";
    }

    // 你也可以正常打印看看
    std::printf("data="); print_tp(stdout, data_tp); std::printf("\n");
    std::printf("now ="); print_tp(stdout, now_tp);  std::printf("\n");
    std::printf("diff = %lld ms\n", delta_ms);

    return 0;
}
