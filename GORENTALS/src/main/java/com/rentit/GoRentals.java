package com.rentit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// Note: @EnableAsync lives in AsyncConfig.java, which also wires
// DelegatingSecurityContextAsyncTaskExecutor so audit log threads
// can read the authenticated admin's identity.
public class GoRentals {

	public static void main(String[] args) {
		SpringApplication.run(GoRentals.class, args);
	}

}
