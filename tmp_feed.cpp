Publishing a single row using a mixed-list object

I kdbSocketHandle = khpu("localhost", 5010, "username");
if (kdbSocketHandle > 0)
{
  K row = knk(3, ks((S)"ibm"), kf(93.5), ki(300));
  K r = k(-kdbSocketHandle, ".u.upd", ks((S)"trade"), row, (K)0);
  if(!r) { perror("network error"); return;}
  kclose(kdbSocketHandle);
}

/* File name: singleRow.c */
#include "common.h"
int main() {
    I handle;
    I portnumber= 5010;
    S hostname= "localhost";
    S usernamePassword= "kdb:pass"; 
    K result, singleRow;

    handle= khpu(hostname, portnumber, usernamePassword); 
    if(!handleOk(handle))
        return EXIT_FAILURE;

    singleRow= knk(3, ks((S) "ABC"), kf(10.0), kj(20));
    // Perform single row insert, tickerplant will add timestamp column itself
    result= k(handle, ".u.upd", ks((S) "trade"), singleRow, (K)0); 
    if(isRemoteErr(result)) {
        kclose(handle);
        return EXIT_FAILURE;
    } 

    r0(result);
    kclose(handle);
    return EXIT_SUCCESS;
} 

Publishing multiple rows using a mixed-list object
int n = 100;
S sid[] = {"ibm","gte","kvm"};
K x = knk(3, ktn(KS, n), ktn(KF, n), ktn(KI, n));
for(int i=0; i<n ; i++) {
  kS(kK(x)[0])[i] = ss(sid[i%3]);
  kF(kK(x)[1])[i] = 0.1*i;
  kI(kK(x)[2])[i] = i;
}
K r = k(-kdbSocketHandle, ".u.upd", ks((S)"trade"), x, (K)0);
if(!r) perror("network");

/* File name: multiRow.c */
#include "common.h"
int main() { 
    int i, n= 3; 
    I handle;
    I portnumber= 5010;
    S hostname= "localhost";
    S usernamePassword= "kdb:pass";
    S symbols[]= { "ABC", "DEF", "GHI" };
    K result;

    handle= khpu(hostname, portnumber, usernamePassword);
    if(!handleOk(handle))
        return EXIT_FAILURE;

    K multipleRow= knk(3, ktn(KS, n), ktn(KF, n), ktn(KJ, n)); 
    for(i= 0; i < n; i++) {
        kS(kK(multipleRow)[0])[i]= ss(symbols[i % n]);
        kF(kK(multipleRow)[1])[i]= 10.0 * i;
        kJ(kK(multipleRow)[2])[i]= i;
    }

    // Perform multiple row insert, tickerplant will add timestamp column itself
    result= k(handle, ".u.upd", ks((S) "trade"), multipleRow, (K)0);
    if(isRemoteErr(result)) {
        kclose(handle); 
        return EXIT_FAILURE;
    }

    r0(result); 
    kclose(handle); 
    return EXIT_SUCCESS;
}



Adding a timespan column
/* File name: rowswithtime.c */
#include <time.h>
#include "common.h"

J castTime(struct tm *x) {
    return (J)((60 * x->tm_hour + x->tm_min) * 60 + x->tm_sec) * 1000000000;
}

int main() { 
    J i, n= 3;
    I handle;
    I portnumber= 5010;
    S hostname= "localhost"; 
    K result;
    S usernamePassword= "kdb:pass";
    S symbols[]= { "ABC", "DEF", "GHI" };
    time_t currentTime; struct tm *ct;

    handle= khpu(hostname, portnumber, usernamePassword);
    if(!handleOk(handle))
        return EXIT_FAILURE;

    K multipleRow= knk(4, ktn(KN, n), ktn(KS, n), ktn(KF, n), ktn(KJ, n));
    time(&currentTime);
    ct= localtime(&currentTime);

    for(i= 0; i < n; i++) { 
        kJ(kK(multipleRow)[0])[i]= castTime(ct);
        kS(kK(multipleRow)[1])[i]= ss(symbols[i % n]);
        kF(kK(multipleRow)[2])[i]= 10.0 * i;
        kJ(kK(multipleRow)[3])[i]= i;
    }

    result= k(handle, ".u.upd", ks((S) "trade"), multipleRow, (K)0);
    if(isRemoteErr(result)) {
        kclose(handle); 
        return EXIT_FAILURE;
    }

    r0(result); 
    kclose(handle); 
    return EXIT_SUCCESS;
}


--------------------------------------------
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <k.h>

I handleOk(I handle)
{
    if(handle > 0)
        return 1;
    if(handle == 0)
        fprintf(stderr, "Authentication error %d\n", handle);
    else if(handle == -1)
        fprintf(stderr, "Connection error %d\n", handle);
    else if(handle == -2)
        fprintf(stderr, "Timeout error %d\n", handle);
    return 0;
}

/* common.h */

I isRemoteErr(K x) {
    if(!x) {
        fprintf(stderr, "Network error: %s\n", strerror(errno));
        return 1;
    } else if(-128 == xt) {
        fprintf(stderr, "Error message returned : %s\n", x->s); 
        r0(x);
        return 1;
    }
    return 0;
}
