# Day 1 Questions

## Q1. How much is the current memory capacity of a canister?
A1: 4GB

## Q2. What is the issue with the following code sample?
actor {
  let counter : Nat = 0;
  public func increment_counter() : async () {
    counter := counter + 1;
  };
}

A2: The variable is immutable. It should be mutable.
var counter : Nat = 0;

## Q3. What is the issue with the following code sample?
actor {
  var message : Text = 0;

  public query func change_message(new_message : Text) : async () {
    message := new_message;
    return;
  };

  public query func see_message() : async Text {
    return(message);
  };
}

A3: Even though the type of the message variable is Text, a number is assigned.
change_message method is declared query even though it is updating a variable.
var message : Text = "";
public func change_message(new_message : Text) : async ()