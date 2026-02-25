#include <iostream>
#include <string>
#include <cstring>
#include <unistd.h>
#include <signal.h>
#include <atomic>
#include <thread>
#include <random>
#include <chrono>
#include <vector>

// 需要安装kdb+的c接口库
extern "C" {
    #include "k.h"
}

class HuaxinFeedHandler {
private:
    int sockfd;                    // socket连接句柄
    std::string host;               // tickerplant主机地址
    int port;                       // tickerplant端口
    std::string username_password;   // 用户名密码
    std::atomic<bool> running;       // 运行状态
    I handle;                        // kdb+连接句柄
    
    // 模拟的交易品种
    std::vector<std::string> symbols = {"000001.SZ", "600000.SH", "300001.SZ", 
                                         "000002.SZ", "600036.SH", "601318.SH",
                                         "000858.SZ", "600519.SH", "002415.SZ"};
    
public:
    HuaxinFeedHandler(const std::string& tp_host, int tp_port, 
                      const std::string& tp_userpwd = "")
        : host(tp_host), port(tp_port), username_password(tp_userpwd), 
          sockfd(-1), handle(0), running(false) {
        
        // 初始化kdb+连接
        initializeConnection();
    }
    
    ~HuaxinFeedHandler() {
        stop();
        if (handle) {
            kclose(handle);
            handle = 0;
        }
    }
    
    // 初始化连接
    bool initializeConnection() {
        std::cout << "正在连接到tickerplant: " << host << ":" << port << std::endl;
        
        // 建立kdb+连接
        if (username_password.empty()) {
            handle = khpu((char*)host.c_str(), port, (char*)"");
        } else {
            handle = khpu((char*)host.c_str(), port, (char*)username_password.c_str());
        }
        
        if (handle <= 0) {
            std::cerr << "无法连接到tickerplant: " << host << ":" << port << std::endl;
            return false;
        }
        
        std::cout << "成功连接到tickerplant" << std::endl;
        return true;
    }
    
    // 启动feedhandler
    void start() {
        if (!handle) {
            std::cerr << "连接未建立" << std::endl;
            return;
        }
        
        running = true;
        std::cout << "Huaxin FeedHandler 启动成功" << std::endl;
        
        // 开始发送数据
        sendData();
    }
    
    // 停止feedhandler
    void stop() {
        running = false;
        std::cout << "Huaxin FeedHandler 正在停止..." << std::endl;
    }
    
    // 生成随机价格
    double generatePrice(double base_price, double volatility) {
        static std::random_device rd;
        static std::mt19937 gen(rd());
        static std::normal_distribution<> dist(0.0, 1.0);
        
        return base_price + base_price * volatility * dist(gen) / 100.0;
    }
    
    // 生成随机成交量
    int generateVolume(int base_volume) {
        static std::random_device rd;
        static std::mt19937 gen(rd());
        static std::uniform_int_distribution<> dist(1, 100);
        
        return base_volume + dist(gen) * 100;
    }
    
    // 发送单条行情数据
    bool sendTickData(const std::string& sym, double price, int volume, double amount) {
        if (!handle) return false;
        
        // 构建表行数据
        K data = knk(4);  // 创建包含4个元素的列表
        
        // 设置symbol
        kK(data)[0] = ks((char*)sym.c_str());
        
        // 设置price (float)
        kK(data)[1] = kf(price);
        
        // 设置volume (int)
        kK(data)[2] = ki(volume);
        
        // 设置amount (float)
        kK(data)[3] = kf(amount);
        
        // 创建表名
        K table_name = ks((char*)"md");
        
        // 调用tickerplant的插入函数
        K result = k(handle, ".u.upd", table_name, data, (K)0);
        
        if (!result || result->t == -128) {  // -128表示错误
            std::cerr << "发送数据失败" << std::endl;
            r0(data);
            r0(table_name);
            if (result) r0(result);
            return false;
        }
        
        // 清理内存
        r0(data);
        r0(table_name);
        if (result) r0(result);
        
        return true;
    }
    
    // 模拟行情数据并发送
    void sendData() {
        // 存储每个symbol的基础价格
        std::map<std::string, double> base_prices;
        std::map<std::string, int> base_volumes;
        
        // 初始化基础价格
        for (const auto& sym : symbols) {
            base_prices[sym] = 10.0 + (rand() % 100);
            base_volumes[sym] = 10000 + (rand() % 50000);
        }
        
        int tick_count = 0;
        auto last_time = std::chrono::steady_clock::now();
        
        while (running) {
            try {
                // 为每个symbol生成行情数据
                for (const auto& sym : symbols) {
                    double price = generatePrice(base_prices[sym], 0.1);
                    int volume = generateVolume(base_volumes[sym]);
                    double amount = price * volume;
                    
                    // 更新基础价格（模拟价格变动）
                    base_prices[sym] = price;
                    
                    // 发送数据
                    if (sendTickData(sym, price, volume, amount)) {
                        tick_count++;
                        
                        // 打印发送状态
                        std::cout << "发送数据: Sym=" << sym 
                                 << ", Price=" << price 
                                 << ", Volume=" << volume 
                                 << ", Amount=" << amount 
                                 << std::endl;
                    }
                    
                    // 微小的延时，避免发送太快
                    std::this_thread::sleep_for(std::chrono::milliseconds(50));
                }
                
                // 每秒统计发送速率
                auto now = std::chrono::steady_clock::now();
                auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(now - last_time);
                
                if (elapsed.count() >= 1) {
                    std::cout << "发送速率: " << tick_count << " ticks/秒" << std::endl;
                    tick_count = 0;
                    last_time = now;
                }
                
            } catch (const std::exception& e) {
                std::cerr << "发送数据异常: " << e.what() << std::endl;
            }
        }
    }
    
    // 检查连接状态
    bool isConnected() {
        return handle > 0;
    }
};

// 信号处理
HuaxinFeedHandler* global_handler = nullptr;

void signalHandler(int signum) {
    std::cout << "\n接收到信号: " << signum << std::endl;
    if (global_handler) {
        global_handler->stop();
    }
}

int main(int argc, char* argv[]) {
    // 默认参数
    std::string host = "localhost";
    int port = 5010;
    std::string userpwd = "";
    
    // 解析命令行参数
    if (argc >= 2) {
        host = argv[1];
    }
    if (argc >= 3) {
        port = std::stoi(argv[2]);
    }
    if (argc >= 4) {
        userpwd = argv[3];
    }
    
    std::cout << "Huaxin FeedHandler 启动中..." << std::endl;
    std::cout << "Tickerplant地址: " << host << ":" << port << std::endl;
    
    // 注册信号处理
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    // 创建并启动feedhandler
    HuaxinFeedHandler handler(host, port, userpwd);
    global_handler = &handler;
    
    if (handler.isConnected()) {
        handler.start();
    } else {
        std::cerr << "启动失败: 无法连接到tickerplant" << std::endl;
        return 1;
    }
    
    // 保持程序运行
    while (handler.isConnected() && global_handler) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    std::cout << "Huaxin FeedHandler 已退出" << std::endl;
    return 0;
}



# 下载kdb+ C接口文件
wget https://github.com/KxSystems/kdb/raw/master/c/k.h
wget https://github.com/KxSystems/kdb/raw/master/c/c.o

# 基本用法
./huaxin_feedhandler localhost 5010

# 带用户名密码
./huaxin_feedhandler localhost 5010 "username:password"

g++ -o huaxin_feedhandler huaxin_feedhandler.cpp c.o -lpthread -std=c++11
