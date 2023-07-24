use candid::types::number::Nat;

pub struct Counter {
    count: Nat,
}

impl Counter {
    pub fn new() -> Self {
        Counter {
            count: Nat::from(0),
        }
    }

    pub fn get(&self) -> Nat {
        self.count.clone()
    }

    pub fn set(&mut self, count: Nat) -> () {
        self.count = count
    }

    pub fn inc(&mut self) -> Nat {
        self.count += 1;

        self.count.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_get() {
        let counter = Counter::new();

        assert_eq!(counter.get(), Nat::from(0));
    }

    #[test]
    fn test_set_get() {
        let mut counter = Counter::new();

        counter.set(Nat::from(7));

        assert_eq!(counter.get(), Nat::from(7));
    }

    #[test]
    fn test_inc_get() {
        let mut counter = Counter::new();

        counter.inc();

        assert_eq!(counter.get(), Nat::from(1));
    }
}
