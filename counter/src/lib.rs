mod counter;

use candid::types::number::Nat;

use counter::Counter;
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<Counter> = RefCell::new(Counter::new());
}

/// Get the value of the counter.
#[ic_cdk_macros::query]
fn get() -> Nat {
    COUNTER.with(|counter| counter.borrow().get())
}

/// Set the value of the counter.
#[ic_cdk_macros::update]
fn set(n: Nat) {
    COUNTER.with(|count| count.borrow_mut().set(n));
}

/// Increment the value of the counter.
#[ic_cdk_macros::update]
fn inc() {
    COUNTER.with(|counter| counter.borrow_mut().inc());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_set() {
        let expected = Nat::from(42);
        set(expected.clone());
        assert_eq!(get(), expected);
    }

    #[test]
    fn test_init() {
        assert_eq!(get(), Nat::from(0));
    }

    #[test]
    fn test_inc() {
        for i in 1..10 {
            inc();
            assert_eq!(get(), Nat::from(i));
        }
    }
}
