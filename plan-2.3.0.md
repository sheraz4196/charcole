# Charcole Version 2.3.0 UPDATE Plan

## Overview (Core Concept)

- Add an independent package @charcoles/payments, which will handle all the payments end to end using stripe or regional payment methoods.
- Make a built in optional module inside both Charcole TS & Charcole JS templates. And users will just have to add stripe keys or regional payment method keys inside their ENV file.
- Since Stripe doesn't work in Pakistan so we will be using LemonSqueezy for the regional payments, so Pakstani developers can enjoy this feature as well.
