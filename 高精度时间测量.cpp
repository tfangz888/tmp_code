#include <bits/stdc++.h>
#include <chrono>
#include <thread>
using namespace std;

uint64_t rdtsc()
{
   uint32_t hi, lo;
   __asm__ __volatile__ ("rdtsc" : "=a"(lo), "=d"(hi));
   return ( (uint64_t)lo)|( ((uint64_t)hi)<<32 );
}

// A sample function whose time taken to
// be measured
void fun()
{
    for (int i=0; i<10; i++)
    {
        this_thread::sleep_for(chrono::milliseconds(200) );
    }
}

int main()
{
    auto start = chrono::high_resolution_clock::now();

    // unsync the I/O of C and C++
    ios_base::sync_with_stdio(false);
    uint64_t t0 = rdtsc();

    fun();

    uint64_t t1 = rdtsc();

    auto end = chrono::high_resolution_clock::now();

    // Calculating total time taken by the program.
    double time_taken =
        chrono::duration_cast<chrono::nanoseconds>(end - start).count();
    cout << "nano secs = " << time_taken << endl;

    time_taken *= 1e-9;
    cout << "time taken by program is : " << fixed
        << time_taken << setprecision(9);
    cout << " sec" << endl;
    cout << " rdtsc = " << unsigned(t1-t0) << endl;

    return 0;
}
