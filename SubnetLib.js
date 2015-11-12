/*
 * Copyright (C) 2015 Alex York
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

var SubnetDataTemplate = {
    address: "",
    ipClass: "",
    subnetsNeeded: 0,
    subnetsAvailable: 0,
    subnetBits: 0,
    hostBits: 0,
    hostsPerSubnet: 0,
    interestingOctetPosition: 0,
    interestingOctet: 0,
    mask: "",
    increment: 0,
    possible: false
};

var Get_SubnetBits = function (subnetsNeeded) {
    bits = 0;

    while ((Math.pow(2, bits)) < subnetsNeeded) {
        ++bits;
    }

    return bits;
};

// Takes an array of numbers
var Get_AddressClass = function (address) {
    var leadingOctet = address[0];

    if (leadingOctet < 128) {
        return "A";
    } else if (leadingOctet < 192) {
        return "B";
    } else if (leadingOctet < 224) {
        return "C";
    } else if (leadingOctet < 240) {
        return "D";
    } else if (leadingOctet < 256) {
        return "E";
    } else {
        return 0;
    }
};

var Get_InterestingOctet =  function (bits) {
    var power = 7;  // Start from left side of byte 2^7
    var octet = 0;

    // 
    while (9 > bits && bits > 0) {
        octet += Math.pow(2, power);
        --bits;
        --power;
    }

    return octet;
};

var Get_Increment = function (octet) {
    if (0 <= octet && octet < 256) {
        return 256-octet;
    } else {
        return 0;
    }
};

var Get_SubnetMask = function (SubnetData) {
    
    switch (SubnetData.ipClass) {
        case "A":
            // 3 possible positions. Any multiple of 8 is a separate octet.
            // After position is found, convert bits to octet.
            
            var networkBits = 8;
            SubnetData.hostBits = 32 - (networkBits + bits);
            SubnetData.hostsPerSubnet = Math.pow(2, SubnetData.hostBits) - 2;
            
            if (bits <= 8) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits);
                SubnetData.mask = [255,octet,0,0];
            } else if (bits <= 16) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits - 8);
                SubnetData.mask = [255,255,octet,0];
            } else if (bits <= 24) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits - 16);
                SubnetData.mask = [255,255,255,octet];
            } else {
                console.log("Not possible");
                return SubnetData;
            }
            break;
            
        case "B":
            // 2 possible positions. Any multiple of 8 is a separate octet.
            // After position is found, convert bits to octet.
            
            var networkBits = 16;
            SubnetData.hostBits = 32 - (networkBits + bits);
            SubnetData.hostsPerSubnet = Math.pow(2, SubnetData.hostBits) - 2;
            
            if (bits <= 8) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits);
                SubnetData.mask = [255,255,octet,0];
            } else if (bits <= 16) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits - 8);
                SubnetData.mask = [255,255,255,octet];
            } else {
                console.log("Not possible");
                return SubnetData;
            }
            break;
            
        case "C":
            // 1 possible position.
            
            var networkBits = 24;
            SubnetData.hostBits = 32 - (networkBits + bits);
            SubnetData.hostsPerSubnet = Math.pow(2, SubnetData.hostBits) - 2;
            
            if (bits <= 8) {
                var octet = SubnetData.interestingOctet = Get_InterestingOctet(bits);
                SubnetData.mask = [255,255,255,octet];
            } else {
                console.log("Not possible");
                return SubnetData;
            }
            break;
            
        default:
            // Nothing
    }
    
    SubnetData.possible = true;
    SubnetData.increment = Get_Increment(SubnetData.interestingOctet);
    
    return SubnetData;
};

var New_SubnetObject = function (address, subnetsNeeded) {
    
    // Crockford recommended object instantiation.
    var SubnetData = Object.create(SubnetDataTemplate);    
    
    SubnetData.address          = address;
    SubnetData.subnetsNeeded    = subnetsNeeded;
    SubnetData.ipClass          = Get_AddressClass(address);
    SubnetData.subnetBits       = Get_SubnetBits(subnetsNeeded);
    SubnetData.subnetsAvailable = Math.pow(2, SubnetData.subnetBits);
    
    SubnetData = Get_SubnetMask(SubnetData);
    
    return SubnetData;
};

var Set_TextById = function (id, value) {
    var element      = document.getElementById(id);
    element.value     = value;
    element.innerHTML = value;
};

var Clear_Text = function (element) {
    element.value = "";
};

var Is_InvalidAddress = function (address) {
    
    if (address.length > 4 || address[0] === 0 ) {
        return true;
    }
    
    // Each octet must fall between 0 and 255.
    for (var i = 0; i < 4; ++i) {
        if (address[i] >= 0 && address[i] <= 255) {
            // Pass
        } else {
            return true;
        }
    }
    
    return false;
};

var button = document.getElementById("calc");
button.onclick = function () {
    
    var address = document.getElementById("address").value;
    address = address.split('.');
    for (var i = 0; i < 4; ++i) {
        address[i] = parseInt(address[i]);
    }
    if (Is_InvalidAddress(address)) {
        alert ("Invalid address detected.");
        return -1;
    }
    
    var subnets   = document.getElementById("subnets").value;
    var SubnetData = New_SubnetObject(address, subnets);
    
    if (SubnetData.possible !== true) {
        alert("Cannot fit " + SubnetData.subnetsNeeded + " subnets into a Class " + SubnetData.ipClass + " address.");
        return -1;
    }
    
    Set_TextById("ipClass", SubnetData.ipClass);
    Set_TextById("subnetBits", SubnetData.subnetBits);
    Set_TextById("subnetsAvailable", SubnetData.subnetsAvailable);
    Set_TextById("hostsPerSubnet", SubnetData.hostsPerSubnet);
    Set_TextById("mask", SubnetData.mask.join('.'));
    Set_TextById("increment", SubnetData.increment);
    
    console.log(SubnetData);
    
    return 0;
};
